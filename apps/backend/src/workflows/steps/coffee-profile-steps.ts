import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COFFEE_PROFILE_MODULE } from "../../modules/coffee-profile"

export type ExtractionPoint = {
  time_s: number
  yield_g: number
  tds?: number
}

export type CustomLabelValue = string | number | string[] | null
export type CustomLabelMap = Record<string, CustomLabelValue>

export type CoffeeProfileInput = {
  origin?: string | null
  altitude_m?: number | null
  varietal?: string | null
  process?: string | null
  roast_level?: string | null
  roast_date?: string | null
  harvest_year?: number | null
  recommended_ratio?: string | null
  tasting_notes?: string[] | null
  custom_labels?: CustomLabelMap | null
  extraction_profile?: ExtractionPoint[] | null
}

type UpsertResult = { profile: any; created: boolean }
type UpsertRollback =
  | { kind: "created"; id: string }
  | { kind: "updated"; before: any }
  | null

export const upsertCoffeeProfileStep = createStep(
  "upsert-coffee-profile",
  async (
    input: CoffeeProfileInput & { product_id: string },
    { container }
  ) => {
    const svc: any = container.resolve(COFFEE_PROFILE_MODULE)
    const [existing] = await svc.listCoffeeProfiles({
      product_id: input.product_id,
    })

    if (existing) {
      const updated = await svc.updateCoffeeProfiles({
        id: existing.id,
        ...stripProductId(input),
      })
      const result: UpsertResult = { profile: updated, created: false }
      const rollback: UpsertRollback = { kind: "updated", before: existing }
      return new StepResponse<UpsertResult, UpsertRollback>(result, rollback)
    }

    const created = await svc.createCoffeeProfiles({
      product_id: input.product_id,
      ...stripProductId(input),
    })
    const result: UpsertResult = { profile: created, created: true }
    const rollback: UpsertRollback = { kind: "created", id: created.id }
    return new StepResponse<UpsertResult, UpsertRollback>(result, rollback)
  },
  async (rollbackData: UpsertRollback, { container }) => {
    if (!rollbackData) return
    const svc: any = container.resolve(COFFEE_PROFILE_MODULE)
    if (rollbackData.kind === "created") {
      await svc.deleteCoffeeProfiles(rollbackData.id)
      return
    }
    const b = rollbackData.before
    await svc.updateCoffeeProfiles({
      id: b.id,
      origin: b.origin,
      altitude_m: b.altitude_m,
      varietal: b.varietal,
      process: b.process,
      roast_level: b.roast_level,
      roast_date: b.roast_date,
      harvest_year: b.harvest_year,
      recommended_ratio: b.recommended_ratio,
      tasting_notes: b.tasting_notes,
      custom_labels: b.custom_labels,
      extraction_profile: b.extraction_profile,
    })
  }
)

function stripProductId<T extends { product_id?: string }>(
  input: T
): Omit<T, "product_id"> {
  const { product_id: _ignored, ...rest } = input
  return rest
}

export const deleteCoffeeProfileStep = createStep(
  "delete-coffee-profile",
  async (input: { product_id: string }, { container }) => {
    const svc: any = container.resolve(COFFEE_PROFILE_MODULE)
    const [existing] = await svc.listCoffeeProfiles({
      product_id: input.product_id,
    })
    if (!existing) return new StepResponse<string | null>(null)
    await svc.deleteCoffeeProfiles(existing.id)
    return new StepResponse<string | null>(existing.id)
  }
)
