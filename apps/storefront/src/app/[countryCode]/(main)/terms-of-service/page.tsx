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
      lastUpdated="1 June 2026"
      intro="These terms govern your purchase of products from Monsoon Coffee Co. By placing an order, you agree to them."
    >
      <LegalSection heading="01 — Orders">
        <p>
          When you place an order, you are making an offer to purchase the
          products in your cart. An order is confirmed only once we accept it and
          send you a confirmation. We may decline or cancel an order — for
          example, where a product is unavailable, a pricing error has occurred,
          or we suspect fraud — and will refund any amount already charged.
        </p>
      </LegalSection>

      <LegalSection heading="02 — Pricing & Payment">
        <p>
          Prices are shown in the currency displayed at checkout and, where
          applicable, are inclusive of taxes unless stated otherwise. Shipping
          charges, if any, are shown before you confirm your order. Payment must
          be completed through our supported payment methods; your order is
          processed once payment is authorised.
        </p>
      </LegalSection>

      <LegalSection heading="03 — Products">
        <p>
          We sell freshly roasted coffee and related goods. Because coffee is a
          natural product roasted in small batches, appearance, weight settling
          and tasting notes may vary slightly between batches. Product images are
          for illustration.
        </p>
      </LegalSection>

      <LegalSection heading="04 — Shipping & Delivery">
        <p>
          We aim to dispatch orders within the timeframe noted at checkout.
          Delivery timelines provided by us or our logistics partners are
          estimates and are not guaranteed. Risk in the products passes to you on
          delivery.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Returns & Refunds">
        <p>
          Returns, replacements and refunds are governed by our{" "}
          <LocalizedClientLink href="/refund-policy">
            Refund Policy
          </LocalizedClientLink>
          , which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Accounts">
        <p>
          If you create an account, you are responsible for keeping your login
          details secure and for all activity under your account. Please notify
          us promptly of any unauthorised use.
        </p>
      </LegalSection>

      <LegalSection heading="07 — Acceptable Use">
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

      <LegalSection heading="08 — Limitation Of Liability">
        <p>
          To the maximum extent permitted by law, our total liability arising
          from any order is limited to the amount you paid for that order. We are
          not liable for indirect or consequential losses. Nothing in these terms
          excludes any rights you have that cannot be excluded under applicable
          law.
        </p>
      </LegalSection>

      <LegalSection heading="09 — Changes & Contact">
        <p>
          We may update these terms from time to time; the version in effect at
          the time of your order applies to that order. Questions? Reach us via
          our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
