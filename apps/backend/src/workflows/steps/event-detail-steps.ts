import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { EVENT_DETAIL_MODULE } from "../../modules/event-detail"

export type EventDetailInput = {
  partner?: string | null
  venue?: string | null
  city?: string | null
  date_label?: string | null
  event_date?: string | null
  seats_total?: number | null
  description?: string | null
  highlights?: string[] | null
  images?: string[] | null
}

type UpsertResult = { detail: any; created: boolean }
type UpsertRollback =
  | { kind: "created"; id: string }
  | { kind: "updated"; before: any }
  | null

export const upsertEventDetailStep = createStep(
  "upsert-event-detail",
  async (
    input: EventDetailInput & { product_id: string },
    { container }
  ) => {
    const svc: any = container.resolve(EVENT_DETAIL_MODULE)
    const [existing] = await svc.listEventDetails({
      product_id: input.product_id,
    })

    if (existing) {
      const updated = await svc.updateEventDetails({
        id: existing.id,
        ...stripProductId(input),
      })
      const result: UpsertResult = { detail: updated, created: false }
      const rollback: UpsertRollback = { kind: "updated", before: existing }
      return new StepResponse<UpsertResult, UpsertRollback>(result, rollback)
    }

    const created = await svc.createEventDetails({
      product_id: input.product_id,
      ...stripProductId(input),
    })
    const result: UpsertResult = { detail: created, created: true }
    const rollback: UpsertRollback = { kind: "created", id: created.id }
    return new StepResponse<UpsertResult, UpsertRollback>(result, rollback)
  },
  async (rollbackData: UpsertRollback, { container }) => {
    if (!rollbackData) return
    const svc: any = container.resolve(EVENT_DETAIL_MODULE)
    if (rollbackData.kind === "created") {
      await svc.deleteEventDetails(rollbackData.id)
      return
    }
    const b = rollbackData.before
    await svc.updateEventDetails({
      id: b.id,
      partner: b.partner,
      venue: b.venue,
      city: b.city,
      date_label: b.date_label,
      event_date: b.event_date,
      seats_total: b.seats_total,
      description: b.description,
      highlights: b.highlights,
      images: b.images,
    })
  }
)

function stripProductId<T extends { product_id?: string }>(
  input: T
): Omit<T, "product_id"> {
  const { product_id: _ignored, ...rest } = input
  return rest
}

export const deleteEventDetailStep = createStep(
  "delete-event-detail",
  async (input: { product_id: string }, { container }) => {
    const svc: any = container.resolve(EVENT_DETAIL_MODULE)
    const [existing] = await svc.listEventDetails({
      product_id: input.product_id,
    })
    if (!existing) return new StepResponse<string | null>(null)
    await svc.deleteEventDetails(existing.id)
    return new StepResponse<string | null>(existing.id)
  }
)
