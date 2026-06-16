import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import AboutSection from "@modules/home/components/about"
import Newsletter from "@modules/home/components/newsletter"
import ContactCta from "@modules/home/components/contact-cta"
import CurrentLedger from "@modules/home/components/current-ledger"
import { getRegion } from "@lib/data/regions"
import JsonLd from "@modules/common/components/json-ld"
import { SITE, organizationJsonLd, websiteJsonLd } from "@lib/util/seo"

export const metadata: Metadata = {
  title: {
    absolute: `${SITE.name} — ${SITE.tagline}`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const region = await getRegion(countryCode).catch(() => null)

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(countryCode)]} />
      <Hero />
      {region ? (
        <CurrentLedger countryCode={countryCode} />
      ) : (
        <section className="border-y border-ink/20 px-6 py-16 text-center font-family-heading">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">
            Catalogue Unavailable
          </p>
          <p className="mt-3 text-2xl font-bold uppercase text-ink">
            We couldn&apos;t reach the roastery for region &ldquo;{countryCode}
            &rdquo;.
          </p>
          <p className="mt-3 font-family-base text-base text-ink/60">
            Confirm your Medusa backend is running and a region for this
            country code is configured.
          </p>
        </section>
      )}
      <AboutSection />
      <ContactCta />
      <Newsletter />
    </>
  )
}
