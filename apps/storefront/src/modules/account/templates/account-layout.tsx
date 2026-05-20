import React from "react"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 bg-surface" data-testid="account-page">
      {children}
    </div>
  )
}

export default AccountLayout
