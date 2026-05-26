import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updateBrewSettingsWorkflow } from "../../../workflows/brew-settings"
import type { UpdateBrewSettingsSchema } from "./middlewares"

type BrewSettingsRow = {
  id: string
  enabled_product_type_ids: string[] | null
}

const empty = (): BrewSettingsRow => ({
  id: "",
  enabled_product_type_ids: [],
})

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const { data } = await query.graph({
      entity: "brew_settings",
      fields: ["id", "enabled_product_type_ids"],
      pagination: { take: 1 },
    })
    const settings: BrewSettingsRow =
      (data?.[0] as BrewSettingsRow | undefined) ?? empty()
    res.json({ brew_settings: settings })
  } catch {
    // Table not yet created (migration not run). Return defaults so the
    // admin UI can still load — saving will fail until migration runs.
    res.json({ brew_settings: empty() })
  }
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateBrewSettingsSchema>,
  res: MedusaResponse
) {
  try {
    const { result } = await updateBrewSettingsWorkflow(req.scope).run({
      input: {
        enabled_product_type_ids: req.validatedBody.enabled_product_type_ids ?? [],
      },
    })
    res.json({ brew_settings: result })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
      error: (msg: string, err?: unknown) => void
    }
    logger.error("Failed to upsert brew settings", e)

    const msg = (e as { message?: string })?.message ?? ""
    if (
      /relation .*brew_settings.* does not exist/i.test(msg) ||
      /no such table.*brew_settings/i.test(msg)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "brew_settings table is missing. Run `npx medusa db:migrate` to create it."
      )
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to save brew settings: ${msg || "unknown error"}`
    )
  }
}
