import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description:
    "Browse the full Monsoon Coffee Co. catalogue — single origins, small-batch roasts and brew gear, freshly roasted to order.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Store | Monsoon Coffee Co.",
    description:
      "Browse the full Monsoon Coffee Co. catalogue — single origins, small-batch roasts and brew gear, freshly roasted to order.",
  },
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    tag_id?: string | string[]
    category_id?: string | string[]
  }>
  params: Promise<{
    countryCode: string
  }>
}

const toArray = (v?: string | string[]) =>
  Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, tag_id, category_id } = searchParams

  const tagIds = toArray(tag_id)
  const categoryIds = toArray(category_id)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      tagIds={tagIds.length > 0 ? tagIds : undefined}
      categoryIds={categoryIds.length > 0 ? categoryIds : undefined}
      countryCode={params.countryCode}
    />
  )
}
