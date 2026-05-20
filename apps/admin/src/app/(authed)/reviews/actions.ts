"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/session"

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export type AdminReview = {
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

export type ReviewsListResult = {
  reviews: AdminReview[]
  total: number
  summary: {
    count: number
    average_rating: number
    by_status: Record<string, number>
  }
}

export type ListReviewsFilters = {
  product_id?: string
  status?: "pending" | "published" | "rejected"
  rating?: number
  q?: string
  limit?: number
  offset?: number
}

type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function authedFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ActionResult<T>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: "Not authenticated." }
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text()
      return {
        ok: false,
        error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      }
    }
    const text = await res.text()
    const json = text ? (JSON.parse(text) as T) : (undefined as T)
    return { ok: true, data: json }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Request failed." }
  }
}

export async function listAllReviews(
  filters: ListReviewsFilters = {}
): Promise<ActionResult<ReviewsListResult>> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set("product_id", filters.product_id)
  if (filters.status) params.set("status", filters.status)
  if (filters.rating) params.set("rating", String(filters.rating))
  if (filters.q) params.set("q", filters.q)
  if (filters.limit != null) params.set("limit", String(filters.limit))
  if (filters.offset != null) params.set("offset", String(filters.offset))
  const qs = params.toString()
  return authedFetch<ReviewsListResult>(
    `/admin/reviews${qs ? `?${qs}` : ""}`
  )
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const res = await authedFetch(`/admin/reviews/${id}`, { method: "DELETE" })
  if (res.ok) {
    revalidatePath("/reviews")
    revalidatePath("/inventory")
  }
  return res
}
