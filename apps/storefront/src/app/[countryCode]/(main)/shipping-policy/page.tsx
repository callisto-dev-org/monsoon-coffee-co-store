import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Shipping Policy | Monsoon Coffee Co.",
  description:
    "How and when Monsoon Coffee Co. roasts, packs and ships your order — including processing times, delivery estimates, charges and tracking.",
}

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      eyebrow="Shipping & Delivery"
      title={
        <>
          Shipping <br /> Policy.
        </>
      }
      lastUpdated="5 June 2026"
      intro="Every bag is roasted to order and dispatched fresh. Here's exactly how your coffee gets from the drum to your door."
    >
      <LegalSection heading="01 — Processing & Roast Schedule">
        <p>
          Orders are roasted in small batches on a rolling schedule. Most orders
          are roasted, rested and packed within{" "}
          <strong>1&ndash;2 business days</strong> of being placed, and handed
          to our courier within <strong>48 hours</strong> of the roast date.
        </p>
        <p>
          Orders placed on weekends or public holidays enter the queue on the
          next working day.
        </p>
      </LegalSection>

      <LegalSection heading="02 — Delivery Times">
        <p>
          Once dispatched, typical transit times from our roastery are:
        </p>
        <ul>
          <li>
            <strong>Metro cities:</strong> 2&ndash;4 business days
          </li>
          <li>
            <strong>Non-metro &amp; tier-2 cities:</strong> 4&ndash;6 business
            days
          </li>
          <li>
            <strong>Remote &amp; rural pincodes:</strong> 6&ndash;9 business
            days
          </li>
        </ul>
        <p>
          Estimates exclude the roasting window above and may extend during
          peak seasons, weather disruptions or courier delays beyond our
          control.
        </p>
      </LegalSection>

      <LegalSection heading="03 — Shipping Charges">
        <p>
          Shipping is calculated at checkout based on your delivery address and
          order weight. We periodically run free-shipping thresholds and
          subscription perks — applicable discounts will appear on the order
          summary before payment.
        </p>
      </LegalSection>

      <LegalSection heading="04 — Tracking Your Order">
        <p>
          You will receive a dispatch email with a tracking link as soon as
          your order is handed to the courier. If the tracking status hasn&apos;t
          updated within <strong>72 hours</strong> of dispatch, reach out via
          our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>{" "}
          and we&apos;ll chase it with the logistics partner.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Addresses & Failed Deliveries">
        <p>
          Please double-check your shipping address, pincode and phone number
          before placing an order — couriers rely on all three for delivery and
          OTP confirmation. Packages returned to us due to an incorrect address
          or repeated failed delivery attempts may be re-shipped at additional
          cost, or refunded minus original shipping and return charges.
        </p>
      </LegalSection>

      <LegalSection heading="06 — International Shipping">
        <p>
          We currently ship within India only. International orders may be
          considered on request — write to us through our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>{" "}
          and we&apos;ll let you know if we can make it work for your country.
        </p>
      </LegalSection>

      <LegalSection heading="07 — Damaged Or Missing Parcels">
        <p>
          If your order arrives damaged, tampered with or is lost in transit,
          please contact us within <strong>48 hours</strong> of delivery (or of
          the expected delivery date for missing parcels) so we can resolve it
          quickly. See our{" "}
          <LocalizedClientLink href="/refund-policy">
            Refund Policy
          </LocalizedClientLink>{" "}
          for how replacements and refunds are handled.
        </p>
      </LegalSection>

      <LegalSection heading="08 — Questions">
        <p>
          Anything else about shipping or delivery? Our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>{" "}
          is the fastest way to reach us. This policy should be read alongside
          our{" "}
          <LocalizedClientLink href="/terms-of-service">
            Terms of Service
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
