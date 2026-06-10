import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { retrieveCart } from "@lib/data/cart"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

// Rendered dynamically: the shared (main) layout reads per-request cookies
// (customer + cart) for every page. Prerendering this as static (SSG) leaves
// the route in a static context where the layout's cookie reads throw
// DYNAMIC_SERVER_USAGE on on-demand revalidation. Backend product data is still
// cached via the force-cache fetch tags, so this only moves HTML render to
// request time, not the data fetch.
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )
    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode).catch(() => null)

  if (!region) {
    return { title: "Product unavailable | Monsoon Coffee Co." }
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!product) {
    return { title: "Product unavailable | Monsoon Coffee Co." }
  }

  return {
    title: `${product.title} | Monsoon Coffee Co.`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Monsoon Coffee Co.`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

function BackendUnavailable({
  detail,
  countryCode,
}: {
  detail: string
  countryCode: string
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24 text-center font-family-heading">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">
        Roastery Offline
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl font-black uppercase leading-[0.9] text-ink">
        We Can&apos;t Reach The Store Right Now
      </h1>
      <p className="mt-6 font-family-base text-base text-ink/70">
        The Medusa backend at <code>localhost:9000</code> didn&apos;t respond
        for region &ldquo;{countryCode}&rdquo;. Make sure it&apos;s running
        (e.g. <code>pnpm backend:dev</code>) and try again.
      </p>
      <p className="mt-3 text-xs uppercase tracking-widest text-ink/40">
        Detail: {detail}
      </p>
    </main>
  )
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const selectedVariantId = searchParams.v_id

  const [region, productResult, customer, cart] = await Promise.all([
    getRegion(params.countryCode).catch((e: unknown) => e as Error),
    listProducts({
      countryCode: params.countryCode,
      queryParams: { handle: params.handle },
    })
      .then(({ response }) => response.products[0] ?? null)
      .catch((e: unknown) => e as Error),
    retrieveCustomer().catch(() => null),
    retrieveCart().catch(() => null),
  ])

  if (region instanceof Error || !region) {
    const detail =
      region instanceof Error
        ? region.message
        : `No region configured for "${params.countryCode}".`
    return <BackendUnavailable detail={detail} countryCode={params.countryCode} />
  }

  if (productResult instanceof Error) {
    return (
      <BackendUnavailable
        detail={productResult.message}
        countryCode={params.countryCode}
      />
    )
  }

  if (!productResult) {
    notFound()
  }

  const pricedProduct = productResult
  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images ?? []}
      isAuthenticated={!!customer}
      cart={cart}
    />
  )
}
