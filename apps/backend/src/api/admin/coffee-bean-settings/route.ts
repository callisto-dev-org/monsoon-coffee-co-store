import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updateCoffeeBeanSettingsWorkflow } from "../../../workflows/coffee-bean-settings"
import type { UpdateCoffeeBeanSettingsSchema } from "./middlewares"

type LabelKind = "single" | "multi" | "text" | "number"
type LabelCategory = {
  id: string
  name: string
  kind: LabelKind
  values: string[]
}

type CoffeeBeanSettingsRow = {
  id: string
  label_categories: LabelCategory[] | null
}

// Default categories the Bean modal looks up by id. Returned when the
// singleton row is missing or empty so the modal never has empty dropdowns.
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

const empty = (): CoffeeBeanSettingsRow => ({
  id: "",
  label_categories: DEFAULT_CATEGORIES,
})

function resolve(row: CoffeeBeanSettingsRow): CoffeeBeanSettingsRow {
  if (!row.label_categories || row.label_categories.length === 0) {
    return { id: row.id, label_categories: DEFAULT_CATEGORIES }
  }
  // Back-fill kind on any legacy rows that pre-date the schema field.
  return {
    id: row.id,
    label_categories: row.label_categories.map((c) => ({
      ...c,
      kind: c.kind ?? "multi",
    })),
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const { data } = await query.graph({
      entity: "coffee_bean_settings",
      fields: ["id", "label_categories"],
      pagination: { take: 1 },
    })
    const row = data?.[0] as CoffeeBeanSettingsRow | undefined
    res.json({
      coffee_bean_settings: row ? resolve(row) : empty(),
    })
  } catch {
    res.json({ coffee_bean_settings: empty() })
  }
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateCoffeeBeanSettingsSchema>,
  res: MedusaResponse
) {
  try {
    const { result } = await updateCoffeeBeanSettingsWorkflow(req.scope).run({
      input: { label_categories: req.validatedBody.label_categories },
    })
    res.json({ coffee_bean_settings: resolve(result) })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
      error: (msg: string, err?: unknown) => void
    }
    logger.error("Failed to upsert coffee bean settings", e)

    const msg = (e as { message?: string })?.message ?? ""
    if (
      /relation .*coffee_bean_settings.* does not exist/i.test(msg) ||
      /no such table.*coffee_bean_settings/i.test(msg) ||
      /column .*label_categories.* does not exist/i.test(msg)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "coffee_bean_settings is out of date. Run `npx medusa db:migrate`."
      )
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to save coffee bean settings: ${msg || "unknown error"}`
    )
  }
}
