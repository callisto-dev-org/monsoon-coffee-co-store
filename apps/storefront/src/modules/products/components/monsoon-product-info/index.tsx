"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { isEqual } from "lodash"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import {
  addToCartAction,
  buyNowAction,
  updateCartItemQuantityAction,
} from "@modules/products/actions"
import { getProductPrice } from "@lib/util/get-product-price"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import { HighlightCard } from "@modules/common/components/monsoon/highlight-card"
import type { CoffeeProfile } from "@lib/data/coffee-profiles"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isAuthenticated: boolean
  cart: HttpTypes.StoreCart | null
  coffeeProfile?: CoffeeProfile | null
  isCoffeeBeans?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, opt) => {
    if (opt.option_id) acc[opt.option_id] = opt.value
    return acc
  }, {})
}

export default function MonsoonProductInfo({
  product,
  isAuthenticated,
  cart,
  coffeeProfile,
  isCoffeeBeans = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { countryCode } = useParams() as { countryCode: string }
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
  const [isUpdatingQty, startQtyTransition] = useTransition()
  const autoAddTriggered = useRef(false)

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return undefined
    return product.variants.find((v) =>
      isEqual(optionsAsKeymap(v.options), options)
    )
  }, [product.variants, options])

  const { variantPrice, cheapestPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })

  const displayPrice = variantPrice ?? cheapestPrice

  const images = product.images?.length
    ? product.images
    : product.thumbnail
    ? [{ id: "thumb", url: product.thumbnail }]
    : [{ id: "placeholder", url: "/monsoon/images/productBig.png" }]

  const mainImage = images[activeImageIdx] ?? images[0]

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    )
      return true
    return false
  }, [selectedVariant])

  // True only once every product option has a picked value but no variant
  // matches that exact combination — treat as out of stock. Partial
  // selections still show "Select Variant" so the shopper can keep choosing.
  const noVariantMatches = useMemo(() => {
    if (selectedVariant) return false
    const requiredOptionIds = (product.options ?? [])
      .map((o) => o.id)
      .filter((id): id is string => Boolean(id))
    if (!requiredOptionIds.length) return false
    return requiredOptionIds.every((id) => Boolean(options[id]))
  }, [selectedVariant, options, product.options])

  const lineItem = useMemo(() => {
    if (!cart?.items?.length || !selectedVariant?.id) return null
    return (
      cart.items.find((it) => it.variant_id === selectedVariant.id) ?? null
    )
  }, [cart?.items, selectedVariant?.id])

  // Reset optimistic qty whenever the server-provided line item changes
  useEffect(() => {
    setOptimisticQty(null)
  }, [lineItem?.id, lineItem?.quantity])

  const inCartQty = optimisticQty ?? lineItem?.quantity ?? 0

  const maxQty = useMemo(() => {
    if (!selectedVariant) return Number.POSITIVE_INFINITY
    if (!selectedVariant.manage_inventory) return Number.POSITIVE_INFINITY
    if (selectedVariant.allow_backorder) return Number.POSITIVE_INFINITY
    return selectedVariant.inventory_quantity ?? 0
  }, [selectedVariant])

  const canIncrement = inCartQty < maxQty

  const changeQty = (nextQty: number) => {
    if (!lineItem?.id) return
    if (nextQty < 0) return
    if (nextQty > maxQty) return

    setCartError(null)
    setOptimisticQty(nextQty)

    startQtyTransition(async () => {
      const result = await updateCartItemQuantityAction({
        lineId: lineItem.id,
        quantity: nextQty,
      })
      if (!result.ok) {
        setOptimisticQty(null)
        setCartError(result.message)
        return
      }
      router.refresh()
    })
  }

  const runAddToCart = async (variantId: string) => {
    setIsAdding(true)
    setCartError(null)
    try {
      const result = await addToCartAction({
        variantId,
        quantity: 1,
        countryCode,
      })
      if (!result.ok) {
        setCartError(result.message)
        return
      }
      // Just add to the bag — no redirect. The cart dropdown auto-opens to
      // confirm, and the in-page quantity stepper appears for this variant.
      router.refresh()
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Couldn't reach the store. Is the Medusa backend running on :9000?"
      console.error("Error adding to cart", e)
      setCartError(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    await runAddToCart(selectedVariant.id)
  }

  // Buy Now: if the variant is already in the bag, go straight to checkout;
  // otherwise add it first, then the server action redirects to checkout.
  const handleBuyNow = async () => {
    if (!selectedVariant?.id) return

    if (lineItem && inCartQty > 0) {
      router.push(`/${countryCode}/checkout`)
      return
    }

    setIsBuying(true)
    setCartError(null)
    try {
      const result = await buyNowAction({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      // On success the action redirects to checkout and never returns a value;
      // we only land here on failure.
      if (result && !result.ok) {
        setCartError(result.message)
        setIsBuying(false)
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not start checkout."
      setCartError(message)
      setIsBuying(false)
    }
  }

  useEffect(() => {
    const autoAdd = searchParams?.get("autoAdd")
    if (!autoAdd || !isAuthenticated || autoAddTriggered.current) return

    const variantExists = product.variants?.some((v) => v.id === autoAdd)
    if (!variantExists) return

    autoAddTriggered.current = true

    const params = new URLSearchParams(searchParams.toString())
    params.delete("autoAdd")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)

    runAddToCart(autoAdd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated, product.variants])

  // Show the product's tags as badges at the top. Coffee-Beans products
  // lead with the roast level (e.g. "DARK ROAST") followed by tags, capped
  // so the row doesn't grow unbounded.
  const HERO_BADGE_LIMIT = 4
  const productTagValues = (product.tags ?? [])
    .map((t) => t.value)
    .filter((v): v is string => Boolean(v))

  const heroBadges: string[] = []
  if (isCoffeeBeans && coffeeProfile?.roast_level) {
    heroBadges.push(`${coffeeProfile.roast_level} Roast`)
  }
  for (const tag of productTagValues) {
    if (heroBadges.length >= HERO_BADGE_LIMIT) break
    if (heroBadges.some((b) => b.toLowerCase() === tag.toLowerCase())) continue
    heroBadges.push(tag)
  }

  const beanSpecs = (() => {
    if (!isCoffeeBeans || !coffeeProfile) return null
    const notes = (coffeeProfile.tasting_notes ?? []).filter(Boolean)
    const altitude = coffeeProfile.altitude_m
    const origin = coffeeProfile.origin
    if (!notes.length && !altitude && !origin) return null
    return {
      notes: notes.join(", "),
      elevation: altitude ? `${altitude} MASL` : null,
      origin: origin ?? null,
    }
  })()

  return (
    <div className="max-w-7xl w-full mx-auto font-family-heading grid grid-cols-1 lg:grid-cols-12 py-12 lg:py-20 gap-8 lg:gap-12 px-6">
      <div className="flex flex-row lg:flex-col col-span-1 lg:col-span-1 gap-3 sm:gap-4 order-2 lg:order-1 overflow-x-auto scrollbar-hidden lg:overflow-visible">
        {images.slice(0, 6).map((img, idx) => (
          <button
            key={img.id ?? idx}
            type="button"
            onClick={() => setActiveImageIdx(idx)}
            className={`relative w-16 sm:w-20 aspect-square shrink-0 border-2 transition-opacity ${
              idx === activeImageIdx
                ? "border-ink opacity-100 border-4"
                : "border-accent opacity-55 hover:opacity-100"
            }`}
          >
            <Image
              src={img.url ?? "/monsoon/images/product1.png"}
              alt={`${product.title} thumbnail ${idx + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <HighlightCard
        size="lg"
        className="w-full h-fit col-span-1 lg:col-span-5 order-1 lg:order-2"
      >
        <div className="relative w-full aspect-square">
          <Image
            src={mainImage.url ?? "/monsoon/images/productBig.png"}
            alt={product.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </HighlightCard>
      <div className="col-span-1 lg:col-span-6 flex flex-col gap-4 order-3">
        {heroBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {heroBadges.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className={`text-sm px-3 py-1 font-bold uppercase ${
                  i === 0
                    ? "text-surface bg-accent"
                    : "text-ink border-2 border-ink"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
        <span className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-bold uppercase break-words">
          {product.title}
        </span>
        <span className="flex items-end gap-4">
          <span className="text-3xl sm:text-4xl font-semibold">
            {displayPrice?.calculated_price ?? "—"}
          </span>
          {displayPrice?.original_price &&
            displayPrice.original_price !== displayPrice.calculated_price && (
              <span className="text-lg font-light opacity-75 line-through">
                {displayPrice.original_price}
              </span>
            )}
        </span>
        {product.description && (
          <p className="text-base lg:text-lg opacity-75">
            {product.description}
          </p>
        )}

        {beanSpecs && (
          <dl className="mt-2 grid grid-cols-3 border-2 border-ink">
            {beanSpecs.notes && (
              <BeanSpecCell
                label="Tasting Notes"
                value={beanSpecs.notes}
                withRightBorder
              />
            )}
            {beanSpecs.elevation && (
              <BeanSpecCell
                label="Elevation"
                value={beanSpecs.elevation}
                withRightBorder={Boolean(beanSpecs.origin)}
              />
            )}
            {beanSpecs.origin && (
              <BeanSpecCell label="Origin" value={beanSpecs.origin} />
            )}
          </dl>
        )}

        {/* Variant picker — only for products with real variants. A product
            with a single Medusa default variant ("Default option") has nothing
            to choose, so we hide the selector entirely (the lone variant is
            preselected above for add-to-cart). */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-4">
            {(product.options ?? []).map((option) => (
              <div key={option.id} className="flex flex-col gap-2">
                <span className="text-sm font-semibold opacity-60 uppercase">
                  {option.title}
                </span>
                <div className="flex flex-wrap gap-2">
                  {option.values?.map((v) => {
                    const selected = options[option.id!] === v.value
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setOptionValue(option.id!, v.value)}
                        className={`px-4 py-2 border-2 border-ink tracking-tight text-sm font-medium uppercase ${
                          selected
                            ? "bg-accent text-surface"
                            : "bg-surface text-ink"
                        }`}
                      >
                        {v.value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {lineItem && inCartQty > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              In Your Bag
            </span>
            <div className="flex items-stretch border-2 border-ink">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => changeQty(inCartQty - 1)}
                disabled={isUpdatingQty}
                className="grid w-14 place-items-center border-r-2 border-ink bg-surface text-2xl font-black text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="flex flex-1 items-center justify-center gap-2 bg-surface py-4 font-family-heading text-lg font-bold uppercase tracking-[0.18em] text-ink"
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink/55">
                  Qty
                </span>
                <span className="text-2xl">{inCartQty}</span>
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => changeQty(inCartQty + 1)}
                disabled={isUpdatingQty || !canIncrement}
                className="grid w-14 place-items-center border-l-2 border-ink bg-surface text-2xl font-black text-ink hover:bg-ink hover:text-surface disabled:opacity-50"
              >
                +
              </button>
            </div>
            {!canIncrement && (
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink/55">
                Max available in stock
              </span>
            )}
          </div>
        ) : (
          <CTAButton
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || isAdding || isBuying || !inStock}
            className="w-full py-4 text-lg font-medium tracking-tighter mt-2 disabled:opacity-50"
          >
            {!selectedVariant
              ? noVariantMatches
                ? "Out of Stock"
                : "Select Variant"
              : !inStock
              ? "Out of Stock"
              : isAdding
              ? "Adding..."
              : "Add to Bag"}
          </CTAButton>
        )}

        {/* Buy Now — express checkout for the selected variant. */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!selectedVariant || !inStock || isBuying || isAdding}
          className="w-full border-2 border-ink bg-surface py-4 font-family-heading text-lg font-bold uppercase tracking-tighter text-ink hover:bg-ink hover:text-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBuying ? "Starting…" : "Buy Now"}
        </button>

        {cartError && (
          <p
            role="alert"
            className="border-2 border-red-700 bg-red-50 px-4 py-3 font-family-heading text-xs font-bold uppercase tracking-[0.14em] text-red-700"
          >
            {cartError}
          </p>
        )}
        <span className="text-sm opacity-75 text-center font-semibold">
          SHIPS WITHIN 24 HOURS OF ROASTING
        </span>
      </div>
    </div>
  )
}

function BeanSpecCell({
  label,
  value,
  withRightBorder = false,
}: {
  label: string
  value: string
  withRightBorder?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1 px-4 py-3 ${
        withRightBorder ? "border-r-2 border-ink" : ""
      }`}
    >
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-55">
        {label}
      </dt>
      <dd className="text-sm font-bold leading-tight">{value}</dd>
    </div>
  )
}
