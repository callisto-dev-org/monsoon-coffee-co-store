import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { REVIEW_MODULE } from "../modules/review"
import { createReviewStep, deleteReviewStep } from "./steps/review-steps"

export const createReviewWorkflow = createWorkflow(
  "create-review",
  function (input: {
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
  }) {
    const review = createReviewStep(input)

    // Link the review to the product so query.graph can traverse product → reviews.
    const linkData = transform(
      { review, input },
      ({ review, input }) => [
        {
          [Modules.PRODUCT]: { product_id: input.product_id },
          [REVIEW_MODULE]: { review_id: (review as { id: string }).id },
        },
      ]
    )
    createRemoteLinkStep(linkData)

    return new WorkflowResponse(review)
  }
)

export const deleteReviewWorkflow = createWorkflow(
  "delete-review",
  function (input: { id: string }) {
    const id = deleteReviewStep(input)
    return new WorkflowResponse(id)
  }
)
