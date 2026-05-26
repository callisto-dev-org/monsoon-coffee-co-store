"use client"

import MonsoonPincodeCheck from "@modules/common/components/monsoon/pincode-check"
import { usePincodeEstimate } from "@modules/checkout/components/pincode-estimate-context"

type Props = {
  cartId: string
  currency: string
  postalCode: string | null
}

export default function AddressPincodeCheck({
  cartId,
  currency,
  postalCode,
}: Props) {
  const { setEstimate } = usePincodeEstimate()
  return (
    <div className="mt-5 border-t border-ink/15 pt-5">
      <MonsoonPincodeCheck
        cartId={cartId}
        currency={currency}
        initialPincode={postalCode}
        prefillLabel="Using your shipping address"
        onEstimate={setEstimate}
      />
    </div>
  )
}
