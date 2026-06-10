"use client"

import { useState } from "react"

import MonsoonOtpLogin from "@modules/account/components/monsoon-otp-login"
import MonsoonLogin from "@modules/account/components/monsoon-login"

type Props = {
  registerHref?: string
}

// OTP is the default login method; password sign-in is available as a fallback.
export default function MonsoonLoginSwitcher({ registerHref }: Props) {
  const [method, setMethod] = useState<"otp" | "password">("otp")

  return method === "otp" ? (
    <MonsoonOtpLogin
      registerHref={registerHref}
      onUsePassword={() => setMethod("password")}
    />
  ) : (
    <MonsoonLogin
      registerHref={registerHref}
      onUseOtp={() => setMethod("otp")}
    />
  )
}
