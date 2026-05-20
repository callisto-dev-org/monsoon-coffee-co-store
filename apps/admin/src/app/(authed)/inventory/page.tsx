import { adminSdk } from "@/lib/medusa"
import { AddProductButton } from "./add-product-button"
import { ProductActions } from "./product-actions"
import type { EditableProduct } from "./edit-product-modal"
import type { ManagedProduct, ManagedVariant } from "./types"
import type {
  BrewMethodLite,
  BrewRecipeLite,
} from "./manage-brews-modal"

export const dynamic = "force-dynamic"

type LocationLevel = {
  id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity?: number
}

type InventoryItem = {
  id: string
  sku?: string | null
  title?: string | null
  location_levels?: LocationLevel[]
}

type VariantOption = {
  id: string
  value: string
  option?: { id: string; title: string }
  option_id?: string
}

type Variant = {
  id: string
  title?: string | null
  sku?: string | null
  options?: VariantOption[]
  inventory_items?: { inventory?: InventoryItem }[]
}

type ProductOption = {
  id: string
  title: string
  values?: { id: string; value: string }[]
}

type ProductImage = { id?: string; url: string }

type Product = {
  id: string
  title: string
  thumbnail?: string | null
  handle?: string | null
  description?: string | null
  status?: string
  images?: ProductImage[]
  variants?: Variant[]
  options?: ProductOption[]
}

type Location = { id: string; name: string }

async function fetchData() {
  const sdk = await adminSdk()

  const productsRes = await sdk.admin.product.list({
    limit: 200,
    fields:
      "id,title,handle,description,thumbnail,status,*images,*options,*options.values,*variants,*variants.options,*variants.inventory_items.inventory,*variants.inventory_items.inventory.location_levels",
  })

  let locations: Location[] = []
  try {
    const locRes: any = await sdk.admin.stockLocation.list({ limit: 100 })
    locations = locRes?.stock_locations || []
  } catch {
    // no stock location permission / module disabled
  }

  let currencies: string[] = []
  try {
    const curRes: any = await sdk.admin.currency.list({ limit: 100 })
    currencies = (curRes?.currencies || []).map((c: any) => c.code)
  } catch {
    currencies = ["usd"]
  }

  // Brew data: fetch all methods once, plus every recipe and group by product
  // so each row gets only its own recipes.
  let brewMethods: BrewMethodLite[] = []
  const recipesByProduct = new Map<string, BrewRecipeLite[]>()
  try {
    const methodsRes: any = await sdk.client.fetch("/admin/brew-methods")
    brewMethods = methodsRes?.brew_methods || []
    const recipesRes: any = await sdk.client.fetch("/admin/brew-recipes")
    const allRecipes: BrewRecipeLite[] = recipesRes?.brew_recipes || []
    for (const r of allRecipes) {
      if (!r.product_id) continue
      const arr = recipesByProduct.get(r.product_id) || []
      arr.push(r)
      recipesByProduct.set(r.product_id, arr)
    }
  } catch {
    // backend route may be missing if user hasn't restarted yet — degrade gracefully
  }

  return {
    products: (productsRes.products as unknown as Product[]) || [],
    locations,
    currencies: currencies.length ? currencies : ["usd"],
    brewMethods,
    recipesByProduct,
  }
}

function buildManaged(product: Product, locations: Location[]): ManagedProduct {
  const optionTitleById = new Map(
    (product.options || []).map((o) => [o.id, o.title])
  )

  const variants: ManagedVariant[] = (product.variants || []).map((v) => {
    const optionValues: Record<string, string> = {}
    for (const ov of v.options || []) {
      const title =
        ov.option?.title ||
        optionTitleById.get(ov.option_id || "") ||
        ""
      if (title) optionValues[title] = ov.value
    }

    const inventoryItems = (v.inventory_items || [])
      .map((link) => link.inventory)
      .filter((inv): inv is InventoryItem => Boolean(inv))
      .map((inv) => ({
        id: inv.id,
        sku: inv.sku ?? null,
        levels: (inv.location_levels || []).map((l) => ({
          id: l.id,
          location_id: l.location_id,
          stocked_quantity: l.stocked_quantity,
          reserved_quantity: l.reserved_quantity,
        })),
      }))

    return {
      id: v.id,
      title: v.title || "Variant",
      sku: v.sku ?? null,
      optionValues,
      inventoryItems,
    }
  })

  return {
    id: product.id,
    title: product.title,
    options: (product.options || []).map((o) => ({
      id: o.id,
      title: o.title,
      values: (o.values || []).map((v) => v.value),
    })),
    variants,
    locations,
  }
}

export default async function InventoryPage() {
  const { products, locations, currencies, brewMethods, recipesByProduct } =
    await fetchData()

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-mc-primary">
            Stocks
          </p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase">Inventory</h1>
        </div>
        <AddProductButton />
      </header>

      {products.length === 0 && (
        <Empty>
          No products yet. Click <strong className="font-bold">+ New product</strong> to
          create the first one.
        </Empty>
      )}

      <div className="space-y-6">
        {products.map((p) => (
          <ProductBlock
            key={p.id}
            product={p}
            locations={locations}
            currencies={currencies}
            brewMethods={brewMethods}
            brewRecipes={recipesByProduct.get(p.id) || []}
          />
        ))}
      </div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-dashed border-mc-ink/30 bg-mc-surface/50 p-8 text-center text-sm text-mc-secondary">
      {children}
    </div>
  )
}

function ProductBlock({
  product,
  locations,
  currencies,
  brewMethods,
  brewRecipes,
}: {
  product: Product
  locations: Location[]
  currencies: string[]
  brewMethods: BrewMethodLite[]
  brewRecipes: BrewRecipeLite[]
}) {
  const editable: EditableProduct = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status,
    description: product.description,
    thumbnail: product.thumbnail,
    images: (product.images || []).map((i) => i.url),
  }
  const managed = buildManaged(product, locations)

  const totalOnHand = managed.variants.reduce((sum, v) => {
    for (const ii of v.inventoryItems) {
      for (const l of ii.levels) sum += l.stocked_quantity || 0
    }
    return sum
  }, 0)

  return (
    <section className="border-2 border-mc-ink bg-mc-surface shadow-[6px_6px_0px_0px_rgb(var(--mc-ink-rgb))]">
      <header className="flex flex-wrap items-center gap-4 border-b-2 border-mc-ink px-5 py-4">
        {product.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.thumbnail}
            alt=""
            className="h-12 w-12 border border-mc-ink/30 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center border border-mc-ink/30 text-[10px] font-bold uppercase text-mc-secondary">
            n/a
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="truncate font-display text-lg font-black uppercase">
            {product.title}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-mc-secondary">
            {product.id} · {product.status || "draft"} · {managed.variants.length}{" "}
            variant{managed.variants.length === 1 ? "" : "s"} ·{" "}
            <span className="tabular-nums">{totalOnHand}</span> on hand
          </p>
        </div>
        <ProductActions
          editable={editable}
          managed={managed}
          currencies={currencies}
          brewMethods={brewMethods}
          brewRecipes={brewRecipes}
        />
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-mc-ink/5 text-[10px] uppercase tracking-[0.18em] text-mc-secondary">
            <tr>
              <th className="px-5 py-3 text-left">Variant</th>
              <th className="px-5 py-3 text-left">SKU</th>
              <th className="px-5 py-3 text-left">Location</th>
              <th className="px-5 py-3 text-right">Reserved</th>
              <th className="px-5 py-3 text-right">On hand</th>
            </tr>
          </thead>
          <tbody>
            {managed.variants.length === 0 && (
              <tr className="border-t border-mc-ink/10">
                <td
                  colSpan={5}
                  className="px-5 py-6 text-center text-xs text-mc-secondary"
                >
                  No variants yet. Click <strong className="font-bold">Manage variants</strong> to add one.
                </td>
              </tr>
            )}
            {managed.variants.flatMap((v) => {
              if (v.inventoryItems.length === 0) {
                return (
                  <tr key={`${v.id}-empty`} className="border-t border-mc-ink/10">
                    <td className="px-5 py-3 font-medium">{v.title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-mc-secondary">
                      {v.sku || "—"}
                    </td>
                    <td className="px-5 py-3 text-mc-secondary" colSpan={3}>
                      No inventory item linked.
                    </td>
                  </tr>
                )
              }
              return v.inventoryItems.flatMap((ii) => {
                if (ii.levels.length === 0) {
                  return [
                    <tr
                      key={`${v.id}-${ii.id}-noloc`}
                      className="border-t border-mc-ink/10"
                    >
                      <td className="px-5 py-3 font-medium">{v.title}</td>
                      <td className="px-5 py-3 font-mono text-xs text-mc-secondary">
                        {ii.sku || v.sku || "—"}
                      </td>
                      <td className="px-5 py-3 text-mc-secondary" colSpan={3}>
                        No location level.
                      </td>
                    </tr>,
                  ]
                }
                return ii.levels.map((lvl) => {
                  const locName =
                    locations.find((l) => l.id === lvl.location_id)?.name ||
                    lvl.location_id
                  return (
                    <tr
                      key={`${v.id}-${ii.id}-${lvl.id}`}
                      className="border-t border-mc-ink/10"
                    >
                      <td className="px-5 py-3 font-medium">{v.title}</td>
                      <td className="px-5 py-3 font-mono text-xs text-mc-secondary">
                        {ii.sku || v.sku || "—"}
                      </td>
                      <td className="px-5 py-3 text-mc-secondary">{locName}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-mc-secondary">
                        {lvl.reserved_quantity ?? 0}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">
                        {lvl.stocked_quantity}
                      </td>
                    </tr>
                  )
                })
              })
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
