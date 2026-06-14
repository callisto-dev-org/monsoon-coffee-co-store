import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { EVENT_DETAIL_MODULE } from "../../modules/event-detail"

type LinkInput = { product_id: string; event_detail_id: string }

const isDuplicateLinkError = (e: unknown) =>
  /multiple links|already exist|duplicate/i.test((e as Error)?.message ?? "")

const linkDef = (input: LinkInput) => ({
  [Modules.PRODUCT]: { product_id: input.product_id },
  [EVENT_DETAIL_MODULE]: { event_detail_id: input.event_detail_id },
})

// Idempotently link a product to its event detail. The link is 1:1, so a stale
// link left behind by a prior delete makes a plain create throw "Cannot create
// multiple links between 'product' and 'event_detail'". Reads resolve the event
// detail by product_id (not through the link), so an already-present link is
// safe to treat as success — we just need the create not to blow up the save.
export const linkProductEventDetailStep = createStep(
  "link-product-event-detail",
  async (input: LinkInput, { container }) => {
    const link: any = container.resolve(ContainerRegistrationKeys.LINK)
    const def = linkDef(input)
    let createdHere = false
    try {
      await link.create([def])
      createdHere = true
    } catch (e) {
      if (!isDuplicateLinkError(e)) throw e
    }
    return new StepResponse({ def, createdHere }, { def, createdHere })
  },
  async (data, { container }) => {
    // Only undo the link if this step actually created it.
    if (!data?.createdHere) return
    const link: any = container.resolve(ContainerRegistrationKeys.LINK)
    try {
      await link.dismiss([data.def])
    } catch {
      /* ignore */
    }
  }
)

// Dismiss the product ↔ event detail link so deleting a detail doesn't leave an
// orphan that blocks a future re-create. Safe to call when no link exists.
export const unlinkProductEventDetailStep = createStep(
  "unlink-product-event-detail",
  async (input: LinkInput, { container }) => {
    if (!input.event_detail_id) return new StepResponse(null)
    const link: any = container.resolve(ContainerRegistrationKeys.LINK)
    try {
      await link.dismiss([linkDef(input)])
    } catch {
      /* ignore — the link may already be gone */
    }
    return new StepResponse(null)
  }
)
