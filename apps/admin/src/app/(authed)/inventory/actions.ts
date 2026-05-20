"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { adminSdk } from "@/lib/medusa"
import { SESSION_COOKIE } from "@/lib/session"

const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string }

/* ─────────────────────────── Stock ─────────────────────────── */

export async function updateStockBulk(
  changes: { inventory_item_id: string; location_id: string; stocked_quantity: number }[]
): Promise<ActionResult> {
  if (!changes.length) return { ok: true }

  try {
    const sdk = await adminSdk()
    for (const c of changes) {
      await sdk.admin.inventoryItem.updateLevel(c.inventory_item_id, c.location_id, {
        stocked_quantity: c.stocked_quantity,
      })
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update stock." }
  }

  revalidatePath("/inventory")
  return { ok: true }
}

/* ─────────────────────────── Products ─────────────────────────── */

export type CreateProductInput = {
  title: string
  handle?: string
  status: "draft" | "published"
  description?: string
  images?: string[] // ordered list of URLs
}

export async function createProduct(
  input: CreateProductInput
): Promise<ActionResult<{ id: string }>> {
  if (!input.title?.trim()) return { ok: false, error: "Title is required." }

  try {
    const sdk = await adminSdk()
    const productPayload: any = {
      title: input.title.trim(),
      status: input.status,
      ...(input.handle ? { handle: input.handle.trim() } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.images?.length
        ? {
            images: input.images.map((url) => ({ url })),
            thumbnail: input.images[0],
          }
        : {}),
      // No variants — create the shell, add variants from "Manage variants".
    }

    const created: any = await sdk.admin.product.create(productPayload)
    const productId = created?.product?.id

    revalidatePath("/inventory")
    return { ok: true, data: { id: productId } }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to create product." }
  }
}

export type UpdateProductInput = {
  id: string
  title: string
  handle?: string
  status: "draft" | "published" | "proposed" | "rejected"
  description?: string
  images?: string[] // ordered list of URLs; first is thumbnail
}

export async function updateProduct(input: UpdateProductInput): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "Missing product id." }
  if (!input.title?.trim()) return { ok: false, error: "Title is required." }

  try {
    const sdk = await adminSdk()
    const payload: any = {
      title: input.title.trim(),
      status: input.status,
      handle: input.handle?.trim() || undefined,
      description: input.description ?? "",
    }
    if (input.images) {
      payload.images = input.images.map((url) => ({ url }))
      payload.thumbnail = input.images[0] ?? null
    }
    await sdk.admin.product.update(input.id, payload)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update product." }
  }

  revalidatePath("/inventory")
  return { ok: true }
}

/* ─────────────────────────── Variants ─────────────────────────── */

export type CreateVariantInput = {
  productId: string
  // The values this variant takes for each option, keyed by option title.
  // e.g. { "Size": "M", "Color": "Red" }
  optionValues: Record<string, string>
  title: string
  sku?: string
  price?: number // major units
  currency_code?: string
  initial_stock?: number
}

export async function createVariant(input: CreateVariantInput): Promise<ActionResult> {
  if (!input.productId) return { ok: false, error: "Missing product id." }
  if (!input.title?.trim()) return { ok: false, error: "Variant title is required." }

  try {
    const sdk = await adminSdk()

    // Ensure every option value exists on its option; Medusa rejects unknown values.
    const productRes: any = await sdk.admin.product.retrieve(input.productId, {
      fields: "id,*options,*options.values",
    })
    const options: any[] = productRes?.product?.options || []
    for (const [optTitle, value] of Object.entries(input.optionValues)) {
      const opt = options.find((o) => o.title === optTitle)
      if (!opt) continue
      const existing: string[] = (opt.values || []).map((v: any) => v.value)
      if (!existing.includes(value)) {
        try {
          await sdk.admin.product.updateOption(input.productId, opt.id, {
            values: [...existing, value],
          } as any)
        } catch {
          // best effort — surface if variant create fails
        }
      }
    }

    const prices =
      input.price && input.currency_code
        ? [
            {
              amount: Math.round(input.price * 100),
              currency_code: input.currency_code,
            },
          ]
        : undefined

    const variantPayload: any = {
      title: input.title.trim(),
      ...(input.sku ? { sku: input.sku } : {}),
      manage_inventory: true,
      options: input.optionValues,
      ...(prices ? { prices } : {}),
    }

    const created: any = await sdk.admin.product.createVariant(
      input.productId,
      variantPayload
    )

    if (input.initial_stock != null && input.initial_stock >= 0) {
      try {
        const product = created?.product
        const variant = product?.variants?.find(
          (v: any) => v.title === input.title.trim()
        ) || product?.variants?.[product.variants.length - 1]
        const invItemId =
          variant?.inventory_items?.[0]?.inventory_item_id ||
          variant?.inventory_items?.[0]?.inventory?.id
        const locRes: any = await sdk.admin.stockLocation.list({ limit: 1 })
        const locationId = locRes?.stock_locations?.[0]?.id
        if (invItemId && locationId) {
          await sdk.admin.inventoryItem.updateLevel(invItemId, locationId, {
            stocked_quantity: input.initial_stock,
          })
        }
      } catch {
        // non-fatal
      }
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to create variant." }
  }

  revalidatePath("/inventory")
  return { ok: true }
}

export async function updateVariant(input: {
  productId: string
  variantId: string
  title?: string
  sku?: string
}): Promise<ActionResult> {
  if (!input.productId || !input.variantId) {
    return { ok: false, error: "Missing product or variant id." }
  }
  try {
    const sdk = await adminSdk()
    const payload: any = {}
    if (input.title != null) payload.title = input.title.trim()
    if (input.sku != null) payload.sku = input.sku || null
    await sdk.admin.product.updateVariant(input.productId, input.variantId, payload)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update variant." }
  }
  revalidatePath("/inventory")
  return { ok: true }
}

export async function deleteVariant(input: {
  productId: string
  variantId: string
}): Promise<ActionResult> {
  if (!input.productId || !input.variantId) {
    return { ok: false, error: "Missing product or variant id." }
  }
  try {
    const sdk = await adminSdk()
    await sdk.admin.product.deleteVariant(input.productId, input.variantId)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to delete variant." }
  }
  revalidatePath("/inventory")
  return { ok: true }
}

/* ─────────────────────────── Options (variant groups) ─────────────────────────── */

export async function createOption(input: {
  productId: string
  title: string
  values: string[]
}): Promise<ActionResult> {
  if (!input.title?.trim()) return { ok: false, error: "Title is required." }
  if (!input.values?.length) return { ok: false, error: "At least one value is required." }
  try {
    const sdk = await adminSdk()
    await sdk.admin.product.createOption(input.productId, {
      title: input.title.trim(),
      values: input.values.map((v) => v.trim()).filter(Boolean),
    } as any)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to create option." }
  }
  revalidatePath("/inventory")
  return { ok: true }
}

export async function updateOption(input: {
  productId: string
  optionId: string
  title?: string
  values?: string[]
}): Promise<ActionResult> {
  try {
    const sdk = await adminSdk()
    const payload: any = {}
    if (input.title != null) payload.title = input.title.trim()
    if (input.values != null) payload.values = input.values
    await sdk.admin.product.updateOption(input.productId, input.optionId, payload)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update option." }
  }
  revalidatePath("/inventory")
  return { ok: true }
}

export async function deleteOption(input: {
  productId: string
  optionId: string
}): Promise<ActionResult> {
  try {
    const sdk = await adminSdk()
    await sdk.admin.product.deleteOption(input.productId, input.optionId)
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to delete option." }
  }
  revalidatePath("/inventory")
  return { ok: true }
}

/* ─────────────────────────── Reviews ─────────────────────────── */

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

export type AdminReviewSummary = {
  count: number
  average_rating: number
}

export async function fetchProductReviews(
  productId: string
): Promise<
  ActionResult<{ reviews: AdminReview[]; summary: AdminReviewSummary }>
> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: "Not authenticated." }
  try {
    const res = await fetch(
      `${BACKEND}/admin/products/${productId}/reviews`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    )
    if (!res.ok) {
      const body = await res.text()
      return {
        ok: false,
        error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      }
    }
    const json = (await res.json()) as {
      reviews: AdminReview[]
      summary: AdminReviewSummary
    }
    return { ok: true, data: json }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to fetch reviews." }
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: "Not authenticated." }
  try {
    const res = await fetch(`${BACKEND}/admin/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text()
      return {
        ok: false,
        error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
      }
    }
    revalidatePath("/inventory")
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to delete review." }
  }
}

/* ─────────────────────────── Image upload ─────────────────────────── */

// Server action that forwards multipart files to Medusa's /admin/uploads.
// Returns the uploaded files' URLs so the client can append to its image list.
export async function uploadImages(
  formData: FormData
): Promise<ActionResult<{ urls: string[] }>> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File)
  if (!files.length) return { ok: false, error: "No files." }

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: "Not authenticated." }

  const fwd = new FormData()
  for (const f of files) fwd.append("files", f, f.name)

  try {
    const res = await fetch(`${BACKEND}/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fwd,
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text()
      return {
        ok: false,
        error: `Upload failed (${res.status}): ${body || res.statusText}`,
      }
    }
    const json = (await res.json()) as { files?: { url: string }[] }
    const urls = (json.files || []).map((f) => f.url)
    return { ok: true, data: { urls } }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Upload failed." }
  }
}
