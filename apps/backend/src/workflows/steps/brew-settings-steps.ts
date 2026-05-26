import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BREW_MODULE } from "../../modules/brew"

export type BrewSettings = {
  id: string
  enabled_product_type_ids: string[] | null
}

export const upsertBrewSettingsStep = createStep(
  "upsert-brew-settings",
  async (
    input: { enabled_product_type_ids: string[] | null },
    { container }
  ) => {
    const svc: any = container.resolve(BREW_MODULE)
    // Empty filters intentionally — we're treating this table as a singleton.
    const existing: BrewSettings[] = await svc.listBrewSettings()
    const current = existing?.[0]
    if (current) {
      const updated = await svc.updateBrewSettings({
        id: current.id,
        enabled_product_type_ids: input.enabled_product_type_ids,
      })
      return new StepResponse(updated, current)
    }
    const created = await svc.createBrewSettings({
      enabled_product_type_ids: input.enabled_product_type_ids,
    })
    return new StepResponse(created, null)
  },
  async (previous, { container }) => {
    if (!previous) return
    const svc: any = container.resolve(BREW_MODULE)
    await svc.updateBrewSettings({
      id: previous.id,
      enabled_product_type_ids: previous.enabled_product_type_ids,
    })
  }
)
