import { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@modules/legal/components/legal-page"
import {
  TERMS_PARAGRAPHS,
  PRIVACY_SECTIONS,
  REFUND_INTRO,
  REFUND_POINTS,
  RETURN_PARAGRAPHS,
  SHIPPING_PARAGRAPHS,
} from "@modules/legal/content"

export const metadata: Metadata = {
  title: "Terms & Conditions | Monsoon Coffee Co.",
  description:
    "Terms & Conditions, Privacy Policy, Refund & Cancellation, Return and Shipping policies for the Monsoon Coffee Co. platform.",
}

export default function TermsAndConditionsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms & Conditions">
      <LegalSection heading="Terms & Conditions">
        {TERMS_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LegalSection>

      <LegalSection heading="Privacy Policy">
        {PRIVACY_SECTIONS.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2">
            <h3 className="text-base font-bold uppercase tracking-wide text-ink">
              {section.heading}
            </h3>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ))}
      </LegalSection>

      <LegalSection heading="Refund and Cancellation Policy">
        <p>{REFUND_INTRO}</p>
        {REFUND_POINTS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LegalSection>

      <LegalSection heading="Return Policy">
        {RETURN_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LegalSection>

      <LegalSection heading="Shipping Policy">
        {SHIPPING_PARAGRAPHS.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </LegalSection>
    </LegalPage>
  )
}
