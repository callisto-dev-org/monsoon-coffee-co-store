import { adminSdk } from "@/lib/medusa"
import { listAllReviews } from "./actions"
import { ReviewsView } from "./reviews-view"

export const dynamic = "force-dynamic"

export type ProductLite = {
  id: string
  title: string
  thumbnail?: string | null
}

async function fetchProductsForFilter(): Promise<ProductLite[]> {
  try {
    const sdk = await adminSdk()
    const res = await sdk.admin.product.list({
      limit: 200,
      fields: "id,title,thumbnail",
    })
    return (res.products as unknown as ProductLite[]) || []
  } catch {
    return []
  }
}

export default async function ReviewsPage() {
  const [productsResult, initialResult] = await Promise.all([
    fetchProductsForFilter(),
    listAllReviews({ limit: 20, offset: 0 }),
  ])

  const initial = initialResult.ok
    ? initialResult.data!
    : {
        reviews: [],
        total: 0,
        summary: { count: 0, average_rating: 0, by_status: {} },
      }

  return <ReviewsView initial={initial} products={productsResult} />
}
