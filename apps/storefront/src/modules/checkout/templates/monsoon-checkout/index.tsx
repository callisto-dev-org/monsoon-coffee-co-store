import { HttpTypes } from "@medusajs/types"

import { convertToLocale } from "@lib/util/money"
import MonsoonPaymentPicker from "@modules/checkout/components/monsoon-payment-picker"
import PlaceOrder from "@modules/checkout/components/place-order"
import { isPhonePe } from "@lib/constants"
import { CheckIcon } from "@modules/common/icons/monsoon/check"
import { PincodeEstimateProvider } from "@modules/checkout/components/pincode-estimate-context"
import AddressPincodeCheck from "@modules/checkout/components/address-pincode-check"
import CheckoutYourBag from "@modules/checkout/components/checkout-your-bag"
import CheckoutAddressStep from "@modules/checkout/components/checkout-address-step"

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
    <div className="flex items-center gap-3 border-b-2 border-ink pb-3 sm:gap-4">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center border-2 border-ink font-family-heading text-base font-black sm:h-10 sm:w-10 sm:text-lg ${
          done ? "bg-ink text-surface" : "bg-surface text-ink"
        }`}
      >
        {done ? <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : index}
      </span>
      <h2 className="min-w-0 font-family-heading text-xl font-black uppercase tracking-tight text-ink sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {done && (
        <span className="ml-auto shrink-0 font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent sm:text-xs">
          Saved
        </span>
      )}
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
  const activePaymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const hasPaymentSession = !!activePaymentSession
  const usingPhonePe = !!isPhonePe(activePaymentSession?.provider_id)

  const canPlaceOrder = hasAddress && hasPaymentSession

  return (
    <PincodeEstimateProvider>
      <main className="mx-auto w-full max-w-[88rem] overflow-x-clip px-5 pb-24 pt-10 sm:px-8 sm:pt-12 lg:px-12">
        <section className="border-b border-ink/30 pb-6">
          <p className="font-family-heading text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Order Confirmation
          </p>
          <h1 className="mt-2 font-family-heading text-4xl font-black uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
            Checkout
          </h1>
        </section>

        {errorMessage && (
          <p className="mt-6 border-2 border-red-700 bg-red-50 p-4 font-family-heading text-xs font-bold uppercase tracking-[0.16em] text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 grid gap-8 sm:mt-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex min-w-0 flex-col gap-8 sm:gap-12">
            {/* Step 1: Address */}
            <section className="flex flex-col gap-5">
              <StepHeader index={1} title="Shipping Address" done={hasAddress} />
              <div className="border-2 border-ink bg-surface p-4 sm:p-6">
                <CheckoutAddressStep
                  cart={cart}
                  region={region}
                  customer={customer}
                />
                {hasAddress && (
                  <AddressPincodeCheck
                    cartId={cart.id}
                    currency={currency}
                    postalCode={
                      cart.shipping_address?.postal_code
                        ?.toString()
                        .replace(/\D/g, "") ?? null
                    }
                  />
                )}
              </div>
            </section>

            {/* Step 2: Payment */}
            <section className="flex flex-col gap-5">
              <StepHeader
                index={2}
                title="Payment Method"
                done={hasPaymentSession}
              />
              {!hasAddress ? (
                <p className="border-2 border-ink/30 bg-surface p-4 font-family-base text-sm text-ink/65 sm:p-5">
                  Save your shipping address before selecting a payment method.
                </p>
              ) : (
                <div className="border-2 border-ink bg-surface p-4 sm:p-6">
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
              <div className="border-2 border-ink bg-surface p-4 sm:p-6">
                {!canPlaceOrder ? (
                  <p className="font-family-base text-sm text-ink/65">
                    Complete the previous steps to enable order placement.
                  </p>
                ) : (
                  <PlaceOrder
                    cart={cart}
                    countryCode={countryCode}
                    usingPhonePe={usingPhonePe}
                    totalLabel={convertToLocale({
                      amount: cart.total ?? 0,
                      currency_code: currency,
                    })}
                  />
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
