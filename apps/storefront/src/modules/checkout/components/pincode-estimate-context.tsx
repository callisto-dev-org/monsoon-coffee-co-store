"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react"
import type { PincodeEstimate } from "@modules/common/components/monsoon/pincode-check"

type Ctx = {
  estimate: PincodeEstimate | null
  setEstimate: (e: PincodeEstimate | null) => void
}

const PincodeEstimateContext = createContext<Ctx | null>(null)

// `@types/react` resolves to two versions in this monorepo (Next 15 +
// @medusajs deps), so React's stricter Provider children check trips.
// `any` here only affects type-check, not runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Provider = PincodeEstimateContext.Provider as any

export function PincodeEstimateProvider({ children }: { children: ReactNode }) {
  const [estimate, setEstimate] = useState<PincodeEstimate | null>(null)
  const value = useMemo(() => ({ estimate, setEstimate }), [estimate])
  return <Provider value={value}>{children}</Provider>
}

export function usePincodeEstimate(): Ctx {
  const ctx = useContext(PincodeEstimateContext)
  if (!ctx) {
    return { estimate: null, setEstimate: () => {} }
  }
  return ctx
}
