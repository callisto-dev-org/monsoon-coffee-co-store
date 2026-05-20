import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
  MedusaError,
} from "@medusajs/framework/utils"
import { createReviewWorkflow } from "../../../../../workflows/review"
import type { CreateReviewSchema } from "./middlewares"

// Public list — only published reviews for this product, newest first.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews } = await query.graph({
    entity: "review",
    fields: [
      "id",
      "product_id",
      "customer_id",
      "customer_name",
      "variant_id",
      "variant_title",
      "rating",
      "title",
      "body",
      "images",
      "status",
      "created_at",
    ],
    filters: { product_id: id, status: "published" },
    pagination: { take: 200, order: { created_at: "DESC" } },
  })

  const count = reviews.length
  const avg = count
    ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / count
    : 0

  res.json({
    reviews,
    summary: {
      count,
      average_rating: Number(avg.toFixed(2)),
    },
  })
}

// Strip a leading "data:image/jpeg;base64," prefix if the client sent one.
function stripDataUrl(b64: string): string {
  const m = b64.match(/^data:[^;]+;base64,(.+)$/)
  return m ? m[1] : b64
}

function extFromMime(mime: string): string {
  const ext = mime.split("/")[1] || "bin"
  return ext.toLowerCase().replace(/[^a-z0-9]/g, "")
}

// Authenticated customer creates a review for a product.
// `images` is an ordered list of either { data, mime, name? } (base64 uploads)
// or { url } (already-hosted). Uploads go through Medusa's file module so
// the URLs match wherever your file provider stores them.
export async function POST(
  req: AuthenticatedMedusaRequest<CreateReviewSchema>,
  res: MedusaResponse
) {
  const productId = req.params.id
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Sign in to leave a review."
    )
  }

  // Snapshot customer display name so the review survives renames/deletes.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name", "email"],
    filters: { id: customerId },
  })
  const customer = customers[0]
  const customer_name = customer
    ? [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      customer.email?.split("@")[0] ||
      null
    : null

  // Look up the variant snapshot if one was selected. The variant must belong
  // to this product — otherwise drop it silently.
  let variant_id: string | null = null
  let variant_title: string | null = null
  if (req.validatedBody.variant_id) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "product_id"],
      filters: { id: req.validatedBody.variant_id },
    })
    const v = variants[0]
    if (v && v.product_id === productId) {
      variant_id = v.id
      variant_title = v.title ?? null
    }
  }

  // Upload any base64 images via the file module; pass through any plain URLs.
  const inputImages = req.validatedBody.images || []
  const imageUrls: string[] = []
  if (inputImages.length) {
    const fileService: any = req.scope.resolve(Modules.FILE)
    const toUpload: { filename: string; mimeType: string; content: string }[] =
      []
    const passthroughIndexes: { idx: number; url: string }[] = []

    inputImages.forEach((img, idx) => {
      if ("url" in img) {
        passthroughIndexes.push({ idx, url: img.url })
      } else {
        const ext = extFromMime(img.mime)
        const filename =
          img.name && img.name.includes(".")
            ? img.name
            : `review-${customerId}-${Date.now()}-${idx}.${ext}`
        toUpload.push({
          filename,
          mimeType: img.mime,
          content: stripDataUrl(img.data),
        })
      }
    })

    let uploadedUrls: string[] = []
    if (toUpload.length) {
      try {
        const uploaded = await fileService.createFiles(toUpload)
        uploadedUrls = uploaded.map((f: { url: string }) => f.url)
      } catch (e: any) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          e?.message || "Failed to upload review images."
        )
      }
    }

    // Rebuild in original order so uploads + pass-through URLs stay aligned.
    let uploadCursor = 0
    inputImages.forEach((img, idx) => {
      if ("url" in img) {
        const passthrough = passthroughIndexes.find((p) => p.idx === idx)
        if (passthrough) imageUrls.push(passthrough.url)
      } else {
        const url = uploadedUrls[uploadCursor++]
        if (url) imageUrls.push(url)
      }
    })
  }

  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      product_id: productId,
      customer_id: customerId,
      customer_name,
      variant_id,
      variant_title,
      rating: req.validatedBody.rating,
      title: req.validatedBody.title ?? null,
      body: req.validatedBody.body,
      images: imageUrls.length ? imageUrls : null,
    },
  })

  res.status(201).json({ review: result })
}
