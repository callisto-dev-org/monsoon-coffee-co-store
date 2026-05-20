import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import MonsoonAddressForm from "@modules/checkout/components/monsoon-address-form"
import MonsoonPaymentPicker from "@modules/checkout/components/monsoon-payment-picker"
import MonsoonShippingPicker from "@modules/checkout/components/monsoon-shipping-picker"
import { placeOrderAction } from "@modules/checkout/actions"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CheckIcon } from "@modules/common/icons/monsoon/check"

type Props = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  customer: HttpTypes.StoreCustomer | null
  paymentProviders: { id: string }[]
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  countryCode: string
  errorMessage?: string
}

function StepHeader({
  index,
  title,
  done,
}: {
  index: number
  title: string
  done?: boolean
}) {
  return (
    <div className="flex items-center gap-4 border-b-2 border-ink pb-3">
      <span
        className={`grid h-10 w-10 place-items-center border-2 border-ink font-family-heading text-lg font-black ${
          done ? "bg-ink text-surface" : "bg-surface text-ink"
        }`}
      >
        {done ? <CheckIcon className="h-5 w-5" /> : index}
      </span>
      <h2 className="font-family-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
        {title}
      </h2>
      {done && (
        <span className="ml-auto font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Saved
        </span>
      )}
    </div>
  )
}

function AddressSummary({ address }: { address: HttpTypes.StoreCartAddress }) {
  return (
    <div className="font-family-base text-base text-ink/80">
      <p className="font-bold uppercase font-family-heading">
        {[address.first_name, address.last_name].filter(Boolean).join(" ")}
      </p>
      <p>{address.address_1}</p>
      {address.address_2 && <p>{address.address_2}</p>}
      <p>
        {[address.city, address.province, address.postal_code]
          .filter(Boolean)
          .join(", ")}
      </p>
      <p className="uppercase">{address.country_code}</p>
      {address.phone && <p>{address.phone}</p>}
    </div>
  )
}

export default async function MonsoonCheckout({
  cart,
  region,
  customer,
  paymentProviders,
  shippingOptions,
  countryCode,
  errorMessage,
}: Props) {
  const currency = cart.currency_code
  const hasAddress = !!cart.shipping_address?.address_1
  const hasShippingMethod = !!cart.shipping_methods?.length
  const hasPaymentSession = !!cart.payment_collection?.payment_sessions?.some(
    (s) => s.status === "pending"
  )

  const canPlaceOrder = hasAddress && hasShippingMethod && hasPaymentSession

  return (
    <main className="mx-auto w-full max-w-[88rem] px-6 pb-24 pt-12 sm:px-8 lg:px-12">
      <section className="border-b border-ink/30 pb-6">
        <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Order Confirmation
        </p>
        <h1 className="mt-2 font-family-heading text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.9]">
          Checkout
        </h1>
      </section>

      {errorMessage && (
        <p className="mt-6 border-2 border-red-700 bg-red-50 p-4 font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-12">
          {/* Step 1: Address */}
          <section className="flex flex-col gap-5">
            <StepHeader index={1} title="Shipping Address" done={hasAddress} />
            {hasAddress ? (
              <details className="border-2 border-ink bg-surface p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-family-heading text-sm font-bold uppercase tracking-[0.16em] text-ink">
                  <AddressSummary address={cart.shipping_address!} />
                  <span className="text-xs underline underline-offset-4 text-accent">
                    Edit
                  </span>
                </summary>
                <div className="mt-6 border-t border-ink/15 pt-6">
                  <MonsoonAddressForm
                    cart={cart}
                    region={region}
                    customerEmail={customer?.email ?? null}
                    isAuthenticated={!!customer}
                    hasDefaultShipping={
                      !!customer?.addresses?.some((a) => a.is_default_shipping)
                    }
                    addresses={customer?.addresses ?? []}
                  />
                </div>
              </details>
            ) : (
              <div className="border-2 border-ink bg-surface p-5 sm:p-6">
                <MonsoonAddressForm
                  cart={cart}
                  region={region}
                  customerEmail={customer?.email ?? null}
                  isAuthenticated={!!customer}
                  hasDefaultShipping={
                    !!customer?.addresses?.some((a) => a.is_default_shipping)
                  }
                  addresses={customer?.addresses ?? []}
                />
              </div>
            )}
          </section>

          {/* Step 2: Shipping Method */}
          <section className="flex flex-col gap-5">
            <StepHeader
              index={2}
              title="Shipping Method"
              done={hasShippingMethod}
            />
            {!hasAddress ? (
              <p className="border-2 border-ink/30 bg-surface p-5 font-family-base text-sm text-ink/65">
                Save your shipping address before choosing a shipping method.
              </p>
            ) : (
              <div className="border-2 border-ink bg-surface p-5 sm:p-6">
                <MonsoonShippingPicker
                  cart={cart}
                  shippingOptions={shippingOptions}
                />
              </div>
            )}
          </section>

          {/* Step 3: Payment */}
          <section className="flex flex-col gap-5">
            <StepHeader
              index={3}
              title="Payment Method"
              done={hasPaymentSession}
            />
            {!hasShippingMethod ? (
              <p className="border-2 border-ink/30 bg-surface p-5 font-family-base text-sm text-ink/65">
                Choose a shipping method before selecting a payment method.
              </p>
            ) : (
              <div className="border-2 border-ink bg-surface p-5 sm:p-6">
                <MonsoonPaymentPicker
                  providers={paymentProviders}
                  cart={cart}
                />
              </div>
            )}
          </section>

          {/* Step 4: Review & Place */}
          <section className="flex flex-col gap-5">
            <StepHeader index={4} title="Review & Place Order" />
            <div className="border-2 border-ink bg-surface p-5 sm:p-6">
              {!canPlaceOrder ? (
                <p className="font-family-base text-sm text-ink/65">
                  Complete the previous steps to enable order placement.
                </p>
              ) : (
                <form action={placeOrderAction} className="flex flex-col gap-4">
                  <input
                    type="hidden"
                    name="country_code"
                    value={countryCode}
                  />
                  <p className="font-family-base text-sm text-ink/65">
                    By placing your order you confirm you have read and agree to
                    Monsoon Coffee Co.&apos;s terms.
                  </p>
                  <CTAButton
                    type="submit"
                    className="w-full py-4 font-family-heading text-lg font-bold uppercase tracking-[0.16em]"
                  >
                    Place Order —{" "}
                    {convertToLocale({
                      amount: cart.total ?? 0,
                      currency_code: currency,
                    })}
                  </CTAButton>
                </form>
              )}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="h-fit border-2 border-ink bg-surface p-6 shadow-[8px_8px_0px_0px_var(--mc-ink)] lg:sticky lg:top-8">
          <h2 className="font-family-heading text-3xl font-black uppercase text-ink">
            Your Bag
          </h2>

          <ul className="mt-4 flex flex-col gap-4 border-t border-ink/20 pt-4">
            {cart.items?.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 border border-ink/40">
                  <Image
                    src={item.thumbnail || "/monsoon/images/coffeebags.png"}
                    alt={item.product_title ?? "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="font-family-heading text-sm font-bold uppercase text-ink">
                    {item.product_title}
                  </p>
                  <p className="font-family-heading text-xs font-medium uppercase tracking-widest text-ink/55">
                    QTY {item.quantity}
                  </p>
                </div>
                <p className="font-family-heading text-sm font-black text-ink">
                  {convertToLocale({
                    amount: (item.unit_price ?? 0) * item.quantity,
                    currency_code: currency,
                  })}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 border-t border-ink/20 pt-4 font-family-heading text-sm uppercase">
            <div className="flex items-center justify-between py-1">
              <dt className="font-semibold text-ink/75">Subtotal</dt>
              <dd className="font-bold text-ink">
                {convertToLocale({
                  amount: cart.subtotal ?? 0,
                  currency_code: currency,
                })}
              </dd>
            </div>
            <div className="flex items-center justify-between py-1">
              <dt
                className={`font-semibold ${
                  hasShippingMethod ? "text-ink/75" : "text-ink/45"
                }`}
              >
                Shipping
                {hasShippingMethod && cart.shipping_methods?.[0]?.name && (
                  <span className="ml-2 font-family-base text-[10px] font-normal normal-case tracking-normal text-ink/55">
                    {cart.shipping_methods[0].name}
                  </span>
                )}
              </dt>
              <dd
                className={`font-bold ${
                  hasShippingMethod ? "text-ink" : "text-ink/55"
                }`}
              >
                {hasShippingMethod
                  ? convertToLocale({
                      amount: cart.shipping_total ?? 0,
                      currency_code: currency,
                    })
                  : "TBD"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-1">
              <dt className="font-semibold text-ink/45">Tax</dt>
              <dd className="font-bold text-ink/55">
                {convertToLocale({
                  amount: cart.tax_total ?? 0,
                  currency_code: currency,
                })}
              </dd>
            </div>
            <div className="mt-3 border-t border-ink/20 pt-3 flex items-end justify-between">
              <dt className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-ink/70">
                Total
              </dt>
              <dd className="font-family-heading text-3xl font-black text-ink">
                {convertToLocale({
                  amount: cart.total ?? 0,
                  currency_code: currency,
                })}
              </dd>
            </div>
          </dl>

          <LocalizedClientLink
            href="/cart"
            className="mt-6 inline-block font-family-heading text-xs font-bold uppercase tracking-[0.18em] underline underline-offset-4 text-ink/65 hover:text-ink"
          >
            ← Edit Bag
          </LocalizedClientLink>
        </aside>
      </div>
    </main>
  )
}
