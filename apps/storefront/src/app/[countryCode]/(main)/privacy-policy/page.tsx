import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Privacy Policy | Monsoon Coffee Co.",
  description:
    "How Monsoon Coffee Co. collects, uses, stores and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Your Data"
      title={
        <>
          Privacy <br /> Policy.
        </>
      }
      lastUpdated="1 June 2026"
      intro="This policy explains what personal information we collect when you visit our store or place an order, why we collect it, and the choices you have."
    >
      <LegalSection heading="01 — Who We Are">
        <p>
          Monsoon Coffee Co. (&ldquo;Monsoon Coffee&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) operates this online store and is responsible for
          the personal information processed through it. If you have any
          questions about this policy, reach us through our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>

      <LegalSection heading="02 — Information We Collect">
        <p>We collect information in the following ways:</p>
        <ul>
          <li>
            <strong>Information you give us</strong> — your name, email address,
            phone number, shipping and billing addresses, and order details when
            you create an account, check out, contact us, or subscribe to our
            newsletter.
          </li>
          <li>
            <strong>Payment information</strong> — payments are processed by our
            payment provider. We do not store your full card details on our
            servers.
          </li>
          <li>
            <strong>Information collected automatically</strong> — device, browser
            and usage data (such as pages viewed and approximate location)
            gathered through cookies and similar technologies to keep the store
            working and to improve it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="03 — How We Use Your Information">
        <ul>
          <li>To process, fulfil and ship your orders.</li>
          <li>To provide order updates, receipts and customer support.</li>
          <li>
            To send marketing emails where you have asked to receive them (you
            can unsubscribe at any time).
          </li>
          <li>To detect, prevent and address fraud or abuse.</li>
          <li>To comply with our legal and tax obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="04 — Sharing Your Information">
        <p>
          We share personal information only with service providers who help us
          run the store — including payment processors, shipping and logistics
          partners, and email providers — and only to the extent needed to
          perform those services. We may also disclose information where required
          by law. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Cookies">
        <p>
          We use cookies to keep you signed in, remember your cart, and
          understand how the store is used. You can control cookies through your
          browser settings; disabling some cookies may affect how the store
          works.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Data Retention">
        <p>
          We keep your personal information for as long as your account is active
          or as needed to provide our services, and thereafter only as required
          to meet legal, accounting or reporting obligations.
        </p>
      </LegalSection>

      <LegalSection heading="07 — Your Rights">
        <p>
          Subject to applicable law, you may request access to, correction of, or
          deletion of your personal information, and you may withdraw consent to
          marketing at any time. To make a request, contact us through our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>

      <LegalSection heading="08 — Changes To This Policy">
        <p>
          We may update this policy from time to time. When we do, we will revise
          the &ldquo;last updated&rdquo; date above. Significant changes will be
          communicated where appropriate.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
