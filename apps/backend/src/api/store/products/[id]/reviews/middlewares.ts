import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework"
import { authenticate } from "@medusajs/framework/http"
import { z } from "zod"

// Each image is either a freshly-uploaded file (base64 + mime) or an
// already-hosted URL. Capped to 5 per review.
const ImageInputSchema = z.union([
  z.object({
    data: z.string().min(1), // base64 (without `data:` prefix is fine; either form accepted)
    mime: z.string().regex(/^image\//),
    name: z.string().max(200).optional(),
  }),
  z.object({ url: z.string().url() }),
])

export const CreateReviewSchema = z.object({
  variant_id: z.string().trim().min(1).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().min(2).max(2000),
  images: z.array(ImageInputSchema).max(5).optional(),
})
export type CreateReviewSchema = z.infer<typeof CreateReviewSchema>

export const reviewStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/products/:id/reviews",
    method: "POST",
    // Reviews can carry up to 5 base64-encoded photos. Default body limit
    // (~100kb in some Express configs) is far too small.
    bodyParser: { sizeLimit: "12mb" },
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(CreateReviewSchema),
    ],
  },
]
