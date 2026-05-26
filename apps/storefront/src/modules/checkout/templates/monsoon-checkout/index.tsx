import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import MonsoonAddressForm from "@modules/checkout/components/monsoon-address-form"
import MonsoonPaymentPicker from "@modules/checkout/components/monsoon-payment-picker"
import PhonePeButton from "@modules/checkout/components/phonepe-button"
import { placeOrderAction } from "@modules/checkout/actions"
import { isPhonePe } from "@lib/constants"
import { CTAButton } from "@modules/common/components/monsoon/buttons"
import { CheckIcon } from "@modules/common/icons/monsoon/check"
import { PincodeEstimateProvider } from "@modules/checkout/components/pincode-estimate-context"
import AddressPincodeCheck from "@modules/checkout/components/address-pincode-check"
import CheckoutYourBag from "@modules/checkout/components/checkout-your-bag"

type Props = {
  cart: HttpTypes.StoreCart
  region: HttpTypes.StoreRegion
  customer: HttpTypes.StoreCustomer | null
  paymentProviders: { id: string }[]
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
  countryCode,
  errorMessage,
}: Props) {
  const currency = cart.currency_code
  const hasAddress = !!cart.shipping_address?.address_1
  const hasShippingMethod = !!cart.shipping_methods?.length
  const activePaymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const hasPaymentSession = !!activePaymentSession
  const usingPhonePe = isPhonePe(activePaymentSession?.provider_id)

  const canPlaceOrder = hasAddress && hasShippingMethod && hasPaymentSession

  return (
   <PincodeEstimateProvider>
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
              <div className="border-2 border-ink bg-surface p-5">
                <details>
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
                        !!customer?.addresses?.some(
                          (a) => a.is_default_shipping
                        )
                      }
                      addresses={customer?.addresses ?? []}
                    />
                  </div>
                </details>
                <AddressPincodeCheck
                  cartId={cart.id}
                  currency={currency}
                  postalCode={
                    cart.shipping_address?.postal_code
                      ?.toString()
                      .replace(/\D/g, "") ?? null
                  }
                />
              </div>
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

          {/* Step 2: Payment */}
          <section className="flex flex-col gap-5">
            <StepHeader
              index={2}
              title="Payment Method"
              done={hasPaymentSession}
            />
            {!hasAddress ? (
              <p className="border-2 border-ink/30 bg-surface p-5 font-family-base text-sm text-ink/65">
                Save your shipping address before selecting a payment method.
              </p>
            ) : (
              <div className="border-2 border-ink bg-surface p-5 sm:p-6">
                {!hasShippingMethod && (
                  <p className="mb-4 border-2 border-amber-600 bg-amber-50 p-3 font-family-heading text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
                    Heads up: no delivery option attached to your bag yet.
                    We&apos;ll try to attach one when you place the order — if it
                    fails, you&apos;ll see the reason here.
                  </p>
                )}
                <MonsoonPaymentPicker
                  providers={paymentProviders}
                  cart={cart}
                />
              </div>
            )}
          </section>

          {/* Step 3: Review & Place */}
          <section className="flex flex-col gap-5">
            <StepHeader index={3} title="Review & Place Order" />
            <div className="border-2 border-ink bg-surface p-5 sm:p-6">
              {!canPlaceOrder ? (
                <p className="font-family-base text-sm text-ink/65">
                  Complete the previous steps to enable order placement.
                </p>
              ) : usingPhonePe ? (
                <div className="flex flex-col gap-4">
                  <p className="font-family-base text-sm text-ink/65">
                    By placing your order you confirm you have read and agree to
                    Monsoon Coffee Co.&apos;s terms. You&apos;ll complete payment
                    in PhonePe&apos;s secure checkout window.
                  </p>
                  <PhonePeButton
                    cart={cart}
                    countryCode={countryCode}
                    className="w-full border-2 border-ink bg-ink py-4 font-family-heading text-lg font-bold uppercase tracking-[0.16em] text-surface hover:bg-surface hover:text-ink disabled:opacity-60"
                  >
                    {`Pay with PhonePe — ${convertToLocale({
                      amount: cart.total ?? 0,
                      currency_code: currency,
                    })}`}
                  </PhonePeButton>
                </div>
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

        <CheckoutYourBag cart={cart} />
      </div>
    </main>
   </PincodeEstimateProvider>
  )
}
