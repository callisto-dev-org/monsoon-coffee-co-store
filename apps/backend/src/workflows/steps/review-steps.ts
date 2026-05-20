import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { REVIEW_MODULE } from "../../modules/review"

export const createReviewStep = createStep(
  "create-review",
  async (
    input: {
      product_id: string
      customer_id?: string | null
      customer_name?: string | null
      variant_id?: string | null
      variant_title?: string | null
      rating: number
      title?: string | null
      body: string
      images?: string[] | null
      status?: "pending" | "published" | "rejected"
    },
    { container }
  ) => {
    const svc: any = container.resolve(REVIEW_MODULE)
    const review = await svc.createReviews({
      product_id: input.product_id,
      customer_id: input.customer_id ?? null,
      customer_name: input.customer_name ?? null,
      variant_id: input.variant_id ?? null,
      variant_title: input.variant_title ?? null,
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      title: input.title ?? null,
      body: input.body,
      images: input.images && input.images.length ? input.images : null,
      status: input.status ?? "published",
    })
    return new StepResponse(review, review.id)
  },
  async (id, { container }) => {
    if (!id) return
    const svc: any = container.resolve(REVIEW_MODULE)
    await svc.deleteReviews(id)
  }
)

export const deleteReviewStep = createStep(
  "delete-review",
  async (input: { id: string }, { container }) => {
    const svc: any = container.resolve(REVIEW_MODULE)
    await svc.deleteReviews(input.id)
    return new StepResponse(input.id)
  }
)
