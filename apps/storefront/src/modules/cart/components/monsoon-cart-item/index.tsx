"use client"

import Image from "next/image"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"

type Props = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

export default function MonsoonCartItem({ item, currencyCode }: Props) {
  const [updating, setUpdating] = useState(false)

  const changeQuantity = async (q: number) => {
    if (q < 1) return
    setUpdating(true)
    try {
      await updateLineItem({ lineId: item.id, quantity: q })
    } finally {
      setUpdating(false)
    }
  }

  const remove = async () => {
    setUpdating(true)
    try {
      await deleteLineItem(item.id)
    } finally {
      setUpdating(false)
    }
  }

  const thumbnail = item.thumbnail || "/monsoon/images/coffeebags.png"

  const price = convertToLocale({
    amount: item.unit_price,
    currency_code: currencyCode,
  })

  return (
    <article className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-ink/15 py-6 sm:grid-cols-[208px_minmax(0,1fr)] sm:gap-6 sm:py-8">
      <div className="relative aspect-square w-full border border-ink/60 sm:aspect-auto sm:h-56">
        <Image
          src={thumbnail}
          alt={item.product_title ?? "Product"}
          fill
          sizes="(min-width: 640px) 208px, 88px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-col">
        {/* Title row — title left, price right (price drops below on tiny screens) */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-family-heading text-lg font-bold uppercase leading-tight text-ink sm:text-2xl lg:text-3xl">
              {item.product_title}
            </h2>
            <p className="mt-1 font-family-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/65 sm:mt-2 sm:text-xs sm:tracking-[0.16em]">
              {item.variant?.title ?? item.product_subtitle ?? ""}
            </p>
          </div>
          <p className="whitespace-nowrap font-family-heading text-xl font-black tabular-nums text-[var(--mc-primary)] sm:text-3xl lg:text-4xl">
            {price}
          </p>
        </div>

        {/* Controls — quantity stepper + remove */}
        <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-7 sm:gap-6">
          <div className="flex h-10 items-stretch border border-ink/70 font-family-heading text-base font-semibold text-ink sm:h-11 sm:text-lg">
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="w-9 border-r border-ink/70 transition-colors hover:bg-ink hover:text-surface disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink sm:w-10"
            >
              −
            </button>
            <span className="grid w-10 place-items-center tabular-nums sm:w-12">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating}
              className="w-9 border-l border-ink/70 transition-colors hover:bg-ink hover:text-surface disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink sm:w-10"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={updating}
            className="font-family-heading text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent transition-colors hover:text-ink disabled:opacity-30"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}
