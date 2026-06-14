import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { COFFEE_PROFILE_MODULE } from "../../modules/coffee-profile"
import { FILTER_CATEGORY_MODULE } from "../../modules/filter-category"
import type { LabelCategory } from "./coffee-bean-settings-steps"

// Mirrors the fallback the coffee-bean-settings route serves when the settings
// row is missing/empty, so a store that has never saved settings still gets its
// core filter sections auto-built.
const DEFAULT_CATEGORIES: LabelCategory[] = [
  {
    id: "roast-levels",
    name: "Roast levels",
    kind: "single",
    values: ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"],
  },
  {
    id: "processes",
    name: "Processes",
    kind: "single",
    values: ["Washed", "Natural", "Honey", "Anaerobic", "Other"],
  },
  { id: "tasting-notes", name: "Tasting notes", kind: "multi", values: [] },
]

// Built-in profile columns that back the well-known facets; every other facet
// reads from custom_labels keyed by its id.
const KNOWN_FIELD: Record<string, keyof ProfileValues> = {
  "roast-levels": "roast_level",
  processes: "process",
  "tasting-notes": "tasting_notes",
}

type ProductTag = { id: string; value: string }

type ProfileValues = {
  roast_level?: string | null
  process?: string | null
  tasting_notes?: string[] | null
  custom_labels?: Record<string, string | number | string[] | null> | null
}

type SyncInput = { product_id: string; profile: ProfileValues }

// Normalise a facet's stored value(s) on a profile to a clean string[].
function profileValuesFor(facetId: string, profile: ProfileValues): string[] {
  const known = KNOWN_FIELD[facetId]
  const raw: unknown = known ? profile[known] : profile.custom_labels?.[facetId]
  if (raw == null) return []
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.map((v) => String(v).trim()).filter(Boolean)
}

// After a coffee profile is saved this step:
//   1. mirrors every "select one" (single) and "select many" (multi) label
//      category into a storefront tagging (filter) category — text/number
//      kinds are skipped since they aren't filterable facets;
//   2. creates a product_tag for each facet value (predefined or chosen);
//   3. tags THIS product with its own selected values, replacing only the
//      facet-managed tags so an operator's manual tags survive and a changed
//      roast/process no longer leaves a stale tag behind.
//
// It is idempotent and additive on categories (unions tag ids, never drops
// curated ones), and it never throws: a sync hiccup must not roll back the
// profile the operator just saved, so all work is wrapped and failures logged.
export const syncProfileFilterCategoriesStep = createStep(
  "sync-profile-filter-categories",
  async (input: SyncInput, { container }) => {
    const logger: any = container.resolve(ContainerRegistrationKeys.LOGGER)
    const profile = input.profile ?? {}
    try {
      const coffeeSvc: any = container.resolve(COFFEE_PROFILE_MODULE)
      const filterSvc: any = container.resolve(FILTER_CATEGORY_MODULE)
      const productSvc: any = container.resolve(Modules.PRODUCT)

      // 1. Resolve the label schema (stored settings or built-in defaults) and
      //    keep only the select-one / select-many facets.
      const [settings] = await coffeeSvc.listCoffeeBeanSettings()
      const labelCategories: LabelCategory[] = settings?.label_categories?.length
        ? settings.label_categories
        : DEFAULT_CATEGORIES
      const facets = labelCategories.filter(
        (c) => c.kind === "single" || c.kind === "multi"
      )
      if (!facets.length) return new StepResponse(void 0)

      // The values this product actually selected, per facet.
      const selectedByFacet = new Map<string, string[]>(
        facets.map((f) => [f.id, profileValuesFor(f.id, profile)])
      )

      // 2. Ensure a product_tag exists for every value we care about — both the
      //    facets' predefined values and this profile's chosen ones (tasting
      //    notes are often free-form and have no predefined list).
      const wantedValues = Array.from(
        new Set(
          [
            ...facets.flatMap((c) => c.values ?? []),
            ...Array.from(selectedByFacet.values()).flat(),
          ]
            .map((v) => v.trim())
            .filter(Boolean)
        )
      )
      const existingTags: ProductTag[] = await productSvc.listProductTags(
        {},
        { take: 1000 }
      )
      const tagByValue = new Map(
        existingTags.map((t) => [t.value.toLowerCase(), t])
      )
      const missing = wantedValues.filter(
        (v) => !tagByValue.has(v.toLowerCase())
      )
      if (missing.length) {
        const created: ProductTag[] = await productSvc.createProductTags(
          missing.map((value) => ({ value }))
        )
        for (const t of created) tagByValue.set(t.value.toLowerCase(), t)
      }
      const idForValue = (v: string) => tagByValue.get(v.trim().toLowerCase())?.id

      // 3. Ensure a filter category per facet, unioning in all of its value tags.
      const existingCats: {
        id: string
        handle: string
        tag_ids?: string[] | null
      }[] = await filterSvc.listFilterCategories({}, { take: 1000 })
      const catByHandle = new Map(existingCats.map((c) => [c.handle, c]))

      for (let i = 0; i < facets.length; i++) {
        const facet = facets[i]
        try {
          const values = [
            ...(facet.values ?? []),
            ...(selectedByFacet.get(facet.id) ?? []),
          ]
          const valueTagIds = Array.from(
            new Set(values.map(idForValue).filter((id): id is string => !!id))
          )

          const existing = catByHandle.get(facet.id)
          if (existing) {
            const prev = existing.tag_ids ?? []
            const union = Array.from(new Set([...prev, ...valueTagIds]))
            if (union.length !== prev.length) {
              await filterSvc.updateFilterCategories({
                id: existing.id,
                tag_ids: union,
              })
            }
          } else {
            await filterSvc.createFilterCategories({
              name: facet.name,
              handle: facet.id,
              rank: i,
              tag_ids: valueTagIds,
            })
          }
        } catch (e) {
          logger?.warn?.(
            `sync-profile-filter-categories: skipped category "${facet.id}" — ${
              (e as Error)?.message
            }`
          )
        }
      }

      // 4. Tag the product with its own selected values. Replace only the
      //    facet-managed tags (the universe of all facet values) so manual
      //    tags survive and a changed selection drops its old tag.
      try {
        const managedTagIds = new Set(
          wantedValues.map(idForValue).filter((id): id is string => !!id)
        )
        const desiredTagIds = Array.from(
          new Set(
            Array.from(selectedByFacet.values())
              .flat()
              .map(idForValue)
              .filter((id): id is string => !!id)
          )
        )
        const product = await productSvc.retrieveProduct(input.product_id, {
          relations: ["tags"],
        })
        const currentTagIds: string[] = (product?.tags ?? []).map(
          (t: { id: string }) => t.id
        )
        const nextTagIds = Array.from(
          new Set([
            ...currentTagIds.filter((id) => !managedTagIds.has(id)),
            ...desiredTagIds,
          ])
        )
        const changed =
          nextTagIds.length !== currentTagIds.length ||
          nextTagIds.some((id) => !currentTagIds.includes(id))
        if (changed) {
          await productSvc.updateProducts(input.product_id, {
            tags: nextTagIds.map((id) => ({ id })),
          })
        }
      } catch (e) {
        logger?.warn?.(
          `sync-profile-filter-categories: could not tag product ${
            input.product_id
          } — ${(e as Error)?.message}`
        )
      }
    } catch (e) {
      logger?.error?.(
        `sync-profile-filter-categories failed: ${(e as Error)?.message}`
      )
    }
    return new StepResponse(void 0)
  }
)
