import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Terms of Service | Monsoon Coffee Co.",
  description:
    "The terms that govern purchases, orders, shipping and payments made through the Monsoon Coffee Co. store.",
}

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="The Fine Print"
      title={
        <>
          Terms Of <br /> Service.
        </>
      }
      lastUpdated="5 June 2026"
      intro="These terms govern your purchase of products from Monsoon Coffee Co. By placing an order, you agree to them."
    >
      <LegalSection heading="01 — Eligibility">
        <p>
          To place an order with us you must be at least 18 years of age, or
          the age of majority in your jurisdiction, and legally able to enter
          into a binding contract. You may not use our products or services
          for any unlawful purpose.
        </p>
      </LegalSection>

      <LegalSection heading="02 — Orders">
        <p>
          When you place an order, you are making an offer to purchase the
          products in your cart. An order is confirmed only once we accept it
          and send you a confirmation. We may decline or cancel an order — for
          example, where a product is unavailable, a pricing error has
          occurred, or we suspect fraud — and will refund any amount already
          charged.
        </p>
      </LegalSection>

      <LegalSection heading="03 — Pricing & Payment">
        <p>
          Prices are shown in the currency displayed at checkout and, where
          applicable, are inclusive of taxes unless stated otherwise. Shipping
          charges, if any, are shown before you confirm your order. Payment
          must be completed through our supported payment methods; your order
          is processed once payment is authorised.
        </p>
        <p>
          We may revise prices, run promotions, or discontinue products at any
          time without prior notice. Such changes will not apply to orders we
          have already confirmed.
        </p>
      </LegalSection>

      <LegalSection heading="04 — Products & Display">
        <p>
          We sell freshly roasted coffee and related goods. Because coffee is
          a natural product roasted in small batches, appearance, weight
          settling and tasting notes may vary slightly between batches.
          Product images and colour swatches are illustrative; on-screen
          colours may differ from the physical product depending on your
          device.
        </p>
        <p>
          We reserve the right to limit the quantity of any product per
          customer, household or order, and to refuse or cancel orders we
          reasonably believe are placed for resale or in breach of these
          terms.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Shipping & Delivery">
        <p>
          We aim to dispatch orders within the timeframe noted at checkout
          and in our{" "}
          <LocalizedClientLink href="/shipping-policy">
            Shipping Policy
          </LocalizedClientLink>
          . Delivery timelines provided by us or our logistics partners are
          estimates and are not guaranteed. Risk in the products passes to
          you on delivery.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Returns & Refunds">
        <p>
          Returns, replacements and refunds are governed by our{" "}
          <LocalizedClientLink href="/refund-policy">
            Refund Policy
          </LocalizedClientLink>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection heading="07 — Accounts">
        <p>
          If you create an account, you are responsible for keeping your login
          details secure and for all activity under your account. You agree to
          provide current, complete and accurate information at checkout and
          to keep it updated. Please notify us promptly of any unauthorised
          use.
        </p>
      </LegalSection>

      <LegalSection heading="08 — Errors, Inaccuracies & Cancellations">
        <p>
          Despite our best efforts, the site may occasionally contain
          typographical errors or inaccuracies relating to product
          descriptions, pricing, promotions, shipping charges or
          availability. We reserve the right to correct any such errors and
          to change, update or cancel orders affected by them, even after an
          order has been placed. If we cancel an order for this reason, we
          will refund the amount paid for it.
        </p>
      </LegalSection>

      <LegalSection heading="09 — Acceptable Use">
        <p>
          You agree to use the store lawfully and not to misuse it, interfere
          with its operation, or attempt to access it in any way other than
          through the interface we provide. Your use of the website is also
          subject to our{" "}
          <LocalizedClientLink href="/terms-of-use">
            Terms of Use
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>

      <LegalSection heading="10 — Limitation Of Liability">
        <p>
          To the maximum extent permitted by law, our total liability arising
          from any order is limited to the amount you paid for that order. We
          are not liable for indirect, incidental or consequential losses —
          including lost profits, loss of data, or replacement costs — arising
          out of your use of the site or any product purchased through it.
          Nothing in these terms excludes any rights you have that cannot be
          excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="11 — Indemnification">
        <p>
          You agree to indemnify and hold harmless Monsoon Coffee Co. and its
          parent company, affiliates, employees and contractors from any
          claim, loss, liability or expense (including reasonable legal fees)
          arising out of your breach of these terms or your violation of any
          law or third-party right.
        </p>
      </LegalSection>

      <LegalSection heading="12 — Severability">
        <p>
          If any provision of these terms is held to be unlawful, void or
          unenforceable, that provision will be enforced to the maximum
          extent permitted and the remaining provisions will continue in full
          force and effect.
        </p>
      </LegalSection>

      <LegalSection heading="13 — Termination">
        <p>
          These terms remain in effect for as long as you use our site or
          services. We may suspend or terminate your access at any time if we
          reasonably believe you have breached these terms. Obligations that
          by their nature should survive termination — including payment,
          indemnification and limitation of liability — will continue to
          apply.
        </p>
      </LegalSection>

      <LegalSection heading="14 — Governing Law">
        <p>
          These terms, and any contract formed under them, are governed by
          the laws of India. Any dispute arising out of or in connection with
          them is subject to the exclusive jurisdiction of the courts at our
          registered place of business.
        </p>
      </LegalSection>

      <LegalSection heading="15 — Changes & Contact">
        <p>
          We may update these terms from time to time; the version in effect
          at the time of your order applies to that order. Your continued use
          of the site following an update constitutes acceptance of the
          revised terms. Questions? Reach us via our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
