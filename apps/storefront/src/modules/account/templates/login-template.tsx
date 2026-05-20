"use client"

import { useState } from "react"

import MonsoonLogin from "@modules/account/components/monsoon-login"
import MonsoonRegister from "@modules/account/components/monsoon-register"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)

  return (
    <main className="w-full px-6 py-16 sm:py-24 lg:py-32 bg-surface min-h-[70vh]">
      {currentView === LOGIN_VIEW.SIGN_IN ? (
        <MonsoonLogin setCurrentView={setCurrentView} />
      ) : (
        <MonsoonRegister setCurrentView={setCurrentView} />
      )}
    </main>
  )
}

export default LoginTemplate
