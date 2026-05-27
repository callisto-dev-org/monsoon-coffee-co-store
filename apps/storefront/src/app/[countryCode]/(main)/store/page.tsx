import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    tag_id?: string | string[]
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, tag_id } = searchParams

  const tagIds = Array.isArray(tag_id)
    ? tag_id.filter(Boolean)
    : tag_id
    ? [tag_id]
    : []

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      tagIds={tagIds.length > 0 ? tagIds : undefined}
      countryCode={params.countryCode}
    />
  )
}
