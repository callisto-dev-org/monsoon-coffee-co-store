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
      lastUpdated="5 June 2026"
      intro="Coffee is roasted to order and perishable, so our refund policy is built around getting you a great cup — not warehousing returns."
    >
      <LegalSection heading="01 — Perishable Goods (Coffee)">
        <p>
          Because our coffee is freshly roasted and perishable, opened bags
          and consumed products are not eligible for return. This does not
          affect any rights you have where a product is defective, damaged in
          transit, or not as described.
        </p>
      </LegalSection>

      <LegalSection heading="02 — Non-Coffee Goods (Merch & Accessories)">
        <p>
          For non-perishable items such as merchandise, brewing accessories
          and gift packaging, you have <strong>30 days</strong> from the date
          of delivery to request a return. To be eligible, the item must be
          unused, in the same condition you received it, with all tags
          attached and in its original packaging. Proof of purchase (order
          number or receipt) is required.
        </p>
      </LegalSection>

      <LegalSection heading="03 — Items We Can&apos;t Accept">
        <p>The following are not eligible for return or refund:</p>
        <ul>
          <li>Opened, brewed or partially consumed coffee.</li>
          <li>Products purchased on sale, clearance or with a discount code marked &ldquo;final sale&rdquo;.</li>
          <li>Gift cards and digital products.</li>
          <li>
            Custom, personalised or special-order items roasted or assembled
            to your specification.
          </li>
          <li>
            Items returned without first requesting and being approved for a
            return (see below).
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="04 — How To Start A Return">
        <p>
          Please contact us first through our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>{" "}
          with your order number and the reason for return. If your return is
          accepted, we&apos;ll share instructions on where and how to ship the
          item back. Items sent to us without prior approval will not be
          processed.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Damaged, Defective Or Wrong Items">
        <p>
          Please inspect your order on arrival. If it is damaged, defective or
          incorrect, contact us within <strong>48 hours</strong> of delivery
          with your order number and clear photos of the product and outer
          packaging. We&apos;ll make it right with a replacement or a refund —
          whichever you prefer.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Exchanges">
        <p>
          The quickest way to get a different item is to request a return on
          the original item and place a fresh order for the replacement. Once
          your return is received and approved, the refund for the original
          purchase will be issued.
        </p>
      </LegalSection>

      <LegalSection heading="07 — How Refunds Are Issued">
        <p>
          Approved refunds are issued to your original payment method. Once
          approved, please allow{" "}
          <strong>5&ndash;10 business days</strong> for the amount to reflect,
          depending on your bank or payment provider. Original shipping
          charges are non-refundable unless the return is due to our error.
        </p>
      </LegalSection>

      <LegalSection heading="08 — Order Changes & Cancellations">
        <p>
          Need to change or cancel an order? Contact us as soon as possible.
          We can usually accommodate changes before an order is roasted and
          dispatched; once it has shipped, it can no longer be cancelled.
        </p>
      </LegalSection>

      <LegalSection heading="09 — Failed Or Delayed Delivery">
        <p>
          If a package is lost in transit or significantly delayed, reach out
          and we will work with our logistics partner to resolve it — through
          a re-shipment or a refund where appropriate. Orders returned to us
          because of an incorrect address or repeated failed delivery attempts
          may be re-shipped at additional cost.
        </p>
      </LegalSection>

      <LegalSection heading="10 — Subscriptions">
        <p>
          If you are on a recurring subscription, you can pause, skip or
          cancel upcoming deliveries before they are processed. Charges for
          orders already roasted and dispatched are handled under the sections
          above.
        </p>
      </LegalSection>

      <LegalSection heading="11 — How To Reach Us">
        <p>
          For anything return- or refund-related, the fastest route is our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          . Have your order number ready so we can help quickly. This policy
          should be read alongside our{" "}
          <LocalizedClientLink href="/terms-of-service">
            Terms of Service
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink href="/shipping-policy">
            Shipping Policy
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
