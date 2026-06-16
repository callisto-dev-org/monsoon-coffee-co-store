import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection, StoreRegion } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { SITE } from "@lib/util/seo"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

// See products/[handle]/page.tsx: the shared (main) layout reads per-request
// cookies, so this route must render dynamically rather than be prerendered as
// static, otherwise on-demand revalidation throws DYNAMIC_SERVER_USAGE.
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    const countryCodes = await listRegions().then(
      (regions: StoreRegion[]) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams
  } catch (error) {
    console.error(
      `Failed to generate static paths for collection pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const description =
    (collection.metadata?.description as string | undefined) ??
    `Shop the ${collection.title} collection at ${SITE.name} — small-batch specialty coffee, freshly roasted.`

  return {
    title: collection.title,
    description,
    alternates: {
      canonical: `/${params.countryCode}/collections/${collection.handle}`,
    },
    openGraph: {
      title: `${collection.title} | ${SITE.name}`,
      description,
      type: "website",
    },
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
