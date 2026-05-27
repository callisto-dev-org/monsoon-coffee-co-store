import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MonsoonCartItem from "@modules/cart/components/monsoon-cart-item"
import MonsoonCartSummary from "@modules/cart/components/monsoon-summary"
import MonsoonPromoCode from "@modules/cart/components/monsoon-promo"
import MonsoonRecommended from "@modules/cart/components/monsoon-recommended"

const CartTemplate = ({
  cart,
  customer,
  countryCode,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  countryCode: string
}) => {
  const hasItems = !!cart?.items?.length

  if (!hasItems) {
    return (
      <main className="mx-auto w-full max-w-[88rem] overflow-x-clip px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <section className="border-b border-ink/40 pb-8">
          <h1 className="font-family-heading text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.86] text-ink">
            Shopping <br /> Bag
          </h1>
          <p className="mt-8 font-family-heading text-sm font-bold uppercase tracking-[0.2em] text-ink/80">
            Your stash is empty.
          </p>
        </section>
        <div className="mt-10">
          <LocalizedClientLink
            href="/store"
            className="inline-flex border-2 border-ink bg-ink px-6 py-3 font-family-heading text-sm font-bold uppercase tracking-[0.2em] text-surface hover:bg-accent transition-colors"
          >
            Explore the Ledger
          </LocalizedClientLink>
        </div>
      </main>
    )
  }

  const itemCount = cart!.items!.reduce((s, i) => s + (i.quantity ?? 0), 0)

  return (
    <main className="mx-auto w-full max-w-[88rem] overflow-x-clip px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">
      <section className="border-b border-ink/40 pb-8">
        <h1 className="font-family-heading text-[clamp(2.75rem,11vw,8rem)] font-black uppercase leading-[0.86] tracking-[-0.02em] text-ink">
          Shopping <br className="hidden sm:inline" />
          <span className="sm:hidden"> </span>Bag
        </h1>
        <p className="mt-8 inline-flex items-center gap-4 font-family-heading text-sm font-bold uppercase tracking-[0.2em] text-ink/80">
          <span className="h-px w-12 bg-ink/70" />
          {itemCount} ITEMS IN YOUR STASH
        </p>
        {!customer && (
          <p className="mt-4 font-family-base text-sm text-ink/60">
            <LocalizedClientLink
              href="/account"
              className="underline underline-offset-4 font-semibold uppercase tracking-widest"
            >
              Sign in
            </LocalizedClientLink>{" "}
            for a faster checkout.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-8 sm:mt-10 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="order-2 min-w-0 lg:order-1">
          {cart!.items!.map((item) => (
            <MonsoonCartItem
              key={item.id}
              item={item}
              currencyCode={cart!.currency_code}
            />
          ))}
          <MonsoonPromoCode />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <MonsoonCartSummary cart={cart!} />
        </div>
      </section>

      <MonsoonRecommended
        countryCode={countryCode}
        excludeIds={cart!.items!.map((i) => i.product_id!).filter(Boolean)}
      />
    </main>
  )
}

export default CartTemplate
