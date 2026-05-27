import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COFFEE_PROFILE_MODULE } from "../../modules/coffee-profile"

export type LabelKind = "single" | "multi" | "text" | "number"

export type LabelCategory = {
  id: string
  name: string
  kind: LabelKind
  values: string[]
}

export type CoffeeBeanSettings = {
  id: string
  label_categories: LabelCategory[] | null
}

export type CoffeeBeanSettingsInput = {
  label_categories: LabelCategory[]
}

export const upsertCoffeeBeanSettingsStep = createStep(
  "upsert-coffee-bean-settings",
  async (input: CoffeeBeanSettingsInput, { container }) => {
    const svc: any = container.resolve(COFFEE_PROFILE_MODULE)
    const existing: CoffeeBeanSettings[] = await svc.listCoffeeBeanSettings()
    const current = existing?.[0]
    if (current) {
      const updated = await svc.updateCoffeeBeanSettings({
        id: current.id,
        label_categories: input.label_categories,
      })
      return new StepResponse(updated, current)
    }
    const created = await svc.createCoffeeBeanSettings({
      label_categories: input.label_categories,
    })
    return new StepResponse(created, null)
  },
  async (previous, { container }) => {
    if (!previous) return
    const svc: any = container.resolve(COFFEE_PROFILE_MODULE)
    await svc.updateCoffeeBeanSettings({
      id: previous.id,
      label_categories: previous.label_categories,
    })
  }
)
