import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Body = {
  event?: string
  product_id?: string
  tags?: string[]
}

const DEFAULT_TAGS = ["products", "categories", "collections", "regions"]

export async function POST(req: NextRequest) {
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "Storefront revalidate not configured" },
      { status: 500 }
    )
  }

  const provided =
    req.headers.get("x-revalidate-secret") ??
    req.nextUrl.searchParams.get("secret")
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as Body
  const tags = new Set<string>([...DEFAULT_TAGS, ...(body.tags ?? [])])
  if (body.product_id) tags.add(`product-${body.product_id}`)

  for (const tag of tags) {
    revalidateTag(tag)
  }

  return NextResponse.json({
    revalidated: true,
    tags: Array.from(tags),
    event: body.event ?? null,
    at: Date.now(),
  })
}
