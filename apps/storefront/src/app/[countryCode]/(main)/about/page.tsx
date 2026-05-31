import { Metadata } from "next"

import AboutTemplate from "@modules/about/templates"
import Newsletter from "@modules/home/components/newsletter"

export const metadata: Metadata = {
  title: "About Us | Monsoon Coffee Co.",
  description:
    "The story behind Monsoon Coffee Co. — a small-batch roastery built on direct sourcing, roast-to-order freshness, and obsessive precision.",
}

export default function AboutPage() {
  return (
    <>
      <AboutTemplate />
      <Newsletter />
    </>
  )
}
