import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Refund Policy | Monsoon Coffee Co.",
  description:
    "Our policy on returns, replacements and refunds for coffee and related products purchased from Monsoon Coffee Co.",
}

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Returns & Refunds"
      title={
        <>
          Refund <br /> Policy.
        </>
      }
      lastUpdated="1 June 2026"
      intro="Coffee is roasted to order and perishable, so our refund policy is built around getting you a great cup — not warehousing returns."
    >
      <LegalSection heading="01 — Perishable Goods">
        <p>
          Because our coffee is freshly roasted and perishable, opened bags and
          consumed products are not eligible for return. This does not affect any
          rights you have where a product is defective or not as described.
        </p>
      </LegalSection>

      <LegalSection heading="02 — Damaged, Defective Or Wrong Items">
        <p>
          If your order arrives damaged, defective, or incorrect, we will make it
          right with a replacement or a refund. Please contact us within{" "}
          <strong>48 hours</strong> of delivery with your order number and clear
          photos of the product and packaging, through our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>

      <LegalSection heading="03 — How Refunds Are Issued">
        <p>
          Approved refunds are issued to your original payment method. Once
          approved, please allow{" "}
          <strong>5&ndash;10 business days</strong> for the amount to reflect,
          depending on your bank or payment provider. Original shipping charges
          are non-refundable unless the return is due to our error.
        </p>
      </LegalSection>

      <LegalSection heading="04 — Order Changes & Cancellations">
        <p>
          Need to change or cancel an order? Contact us as soon as possible. We
          can usually accommodate changes before an order is roasted and
          dispatched; once it has shipped, it can no longer be cancelled.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Failed Or Delayed Delivery">
        <p>
          If a package is lost in transit or significantly delayed, reach out and
          we will work with our logistics partner to resolve it — through a
          re-shipment or a refund where appropriate. Orders returned to us because
          of an incorrect address or repeated failed delivery attempts may be
          re-shipped at additional cost.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Subscriptions">
        <p>
          If you are on a recurring subscription, you can pause, skip or cancel
          upcoming deliveries before they are processed. Charges for orders
          already roasted and dispatched are handled under the sections above.
        </p>
      </LegalSection>

      <LegalSection heading="07 — How To Reach Us">
        <p>
          For anything return- or refund-related, the fastest route is our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          . Have your order number ready so we can help quickly. This policy
          should be read alongside our{" "}
          <LocalizedClientLink href="/terms-of-service">
            Terms of Service
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
