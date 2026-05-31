import { Metadata } from "next"

import Contact from "@modules/home/components/contact"
import StoreMap from "@modules/home/components/contact/store-map"
import Newsletter from "@modules/home/components/newsletter"

export const metadata: Metadata = {
  title: "Contact Us | Monsoon Coffee Co.",
  description:
    "Get in touch with Monsoon Coffee Co. — wholesale enquiries, cupping invites, or just to talk coffee. Visit our Bengaluru roastery.",
}

export default function ContactPage() {
  return (
    <>
      <Contact />
      <StoreMap />
      <Newsletter />
    </>
  )
}
