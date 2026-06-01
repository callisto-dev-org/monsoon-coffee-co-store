import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Terms of Use | Monsoon Coffee Co.",
  description:
    "The terms governing your use of the Monsoon Coffee Co. website and its content.",
}

export default function TermsOfUsePage() {
  return (
    <LegalPage
      eyebrow="Using This Site"
      title={
        <>
          Terms Of <br /> Use.
        </>
      }
      lastUpdated="1 June 2026"
      intro="These terms govern your access to and use of the Monsoon Coffee Co. website. By using the site, you accept them."
    >
      <LegalSection heading="01 — Acceptance">
        <p>
          By accessing or browsing this website you agree to these Terms of Use.
          If you do not agree, please do not use the site. Purchases made through
          the site are additionally governed by our{" "}
          <LocalizedClientLink href="/terms-of-service">
            Terms of Service
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>

      <LegalSection heading="02 — Use Of The Site">
        <p>You agree that you will not:</p>
        <ul>
          <li>Use the site for any unlawful or fraudulent purpose.</li>
          <li>
            Attempt to gain unauthorised access to any part of the site, its
            servers, or connected systems.
          </li>
          <li>
            Interfere with or disrupt the site, including by introducing viruses
            or other harmful material.
          </li>
          <li>
            Scrape, copy or harvest content or data except as expressly permitted.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="03 — Intellectual Property">
        <p>
          All content on this site — including text, graphics, logos, images,
          and the &ldquo;Monsoon Coffee Co.&rdquo; name and branding — is owned by
          us or our licensors and is protected by intellectual-property laws. You
          may not reproduce or use it without our prior written permission, except
          for personal, non-commercial browsing of the site.
        </p>
      </LegalSection>

      <LegalSection heading="04 — Accounts & Security">
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account. Notify
          us promptly of any suspected unauthorised use.
        </p>
      </LegalSection>

      <LegalSection heading="05 — Third-Party Links">
        <p>
          The site may contain links to third-party websites or services that we
          do not control. We are not responsible for their content, policies or
          practices, and including a link does not imply endorsement.
        </p>
      </LegalSection>

      <LegalSection heading="06 — Disclaimer">
        <p>
          The site is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis. We do not warrant that it will be uninterrupted,
          error-free, or free of harmful components, to the maximum extent
          permitted by law.
        </p>
      </LegalSection>

      <LegalSection heading="07 — Privacy">
        <p>
          Your use of the site is also governed by our{" "}
          <LocalizedClientLink href="/privacy-policy">
            Privacy Policy
          </LocalizedClientLink>
          , which explains how we handle your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="08 — Changes & Contact">
        <p>
          We may revise these Terms of Use at any time by updating this page. Your
          continued use of the site means you accept the changes. Questions? Reach
          us via our{" "}
          <LocalizedClientLink href="/contact">
            contact page
          </LocalizedClientLink>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
