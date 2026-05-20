"use client"

import { HttpTypes } from "@medusajs/types"
import { useParams, useRouter } from "next/navigation"
import { convertToLocale } from "@lib/util/money"

type OrderHistoryRowProps = {
  order: HttpTypes.StoreOrder
  currencyCode: string
}

const OrderHistoryRow = ({ order, currencyCode }: OrderHistoryRowProps) => {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode: string }

  const open = () => {
    router.push(`/${countryCode}/account/orders/details/${order.id}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      open()
    }
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      className="cursor-pointer border-b border-ink/30 transition-colors hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
      data-testid="order-history-row"
    >
      <td className="border-r border-ink/30 px-4 py-5 font-family-heading text-lg sm:text-xl font-bold uppercase text-ink">
        {new Date(order.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}
      </td>
      <td className="border-r border-ink/30 px-4 py-5 font-family-heading text-base font-medium uppercase text-ink/55">
        #{order.display_id ?? order.id.slice(-6)}
      </td>
      <td className="border-r border-ink/30 px-4 py-5">
        <span className="inline-flex border px-3 py-2 font-family-heading text-sm font-bold uppercase border-accent/70 bg-[var(--mc-primary)]/20 text-accent">
          {order.status ?? "pending"}
        </span>
      </td>
      <td className="px-4 py-5 text-right font-family-heading text-xl sm:text-2xl font-black text-ink">
        {convertToLocale({
          amount: order.total ?? 0,
          currency_code: order.currency_code ?? currencyCode,
        })}
      </td>
    </tr>
  )
}

export default OrderHistoryRow
