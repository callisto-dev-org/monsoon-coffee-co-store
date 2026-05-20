"use server"

import { revalidatePath } from "next/cache"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type Review = {
  id: string
  product_id: string
  customer_id?: string | null
  customer_name?: string | null
  variant_id?: string | null
  variant_title?: string | null
  rating: number
  title?: string | null
  body: string
  images?: string[] | null
  status: "pending" | "published" | "rejected"
  created_at: string
}

export type ReviewSummary = {
  count: number
  average_rating: number
}

export type ListReviewsResult = {
  reviews: Review[]
  summary: ReviewSummary
}

export async function listProductReviews(
  productId: string
): Promise<ListReviewsResult> {
  try {
    const res = await sdk.client.fetch<ListReviewsResult>(
      `/store/products/${productId}/reviews`,
      { method: "GET", cache: "no-store" }
    )
    return {
      reviews: res?.reviews || [],
      summary: res?.summary || { count: 0, average_rating: 0 },
    }
  } catch {
    return { reviews: [], summary: { count: 0, average_rating: 0 } }
  }
}

// Each image is either an already-hosted URL, or a fresh upload encoded as
// base64 with its MIME type. The backend uploads the latter via the file
// module and stores the resulting URLs alongside the review.
export type ReviewImageInput =
  | { url: string }
  | { data: string; mime: string; name?: string }

export type CreateReviewInput = {
  product_id: string
  variant_id?: string | null
  rating: number
  title?: string | null
  body: string
  images?: ReviewImageInput[]
  productHandle?: string
}

export type CreateReviewResult =
  | { ok: true }
  | { ok: false; error: string; needsAuth?: boolean }

export async function createProductReview(
  input: CreateReviewInput
): Promise<CreateReviewResult> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { ok: false, error: "Sign in to leave a review.", needsAuth: true }
  }

  try {
    await sdk.client.fetch(`/store/products/${input.product_id}/reviews`, {
      method: "POST",
      headers,
      body: {
        variant_id: input.variant_id || undefined,
        rating: input.rating,
        title: input.title || undefined,
        body: input.body,
        images: input.images?.length ? input.images : undefined,
      },
    })
    if (input.productHandle) {
      revalidatePath(`/[countryCode]/(main)/products/${input.productHandle}`, "page")
    }
    return { ok: true }
  } catch (e: any) {
    const msg: string =
      e?.message ||
      (typeof e === "string" ? e : "Could not submit review. Please try again.")
    return {
      ok: false,
      error: msg,
      needsAuth: /unauthorized|401|sign in/i.test(msg),
    }
  }
}
