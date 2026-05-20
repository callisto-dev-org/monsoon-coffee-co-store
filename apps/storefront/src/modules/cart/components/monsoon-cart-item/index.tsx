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

  return (
    <article className="flex flex-col gap-6 border-b border-ink/15 py-8 sm:flex-row sm:items-start">
      <div className="relative h-56 w-full sm:h-56 sm:w-52 border border-ink/60">
        <Image
          src={thumbnail}
          alt={item.product_title ?? "Product"}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className="w-full">
          <h2 className="font-family-heading text-2xl sm:text-3xl font-bold uppercase leading-none text-ink">
            {item.product_title}
          </h2>
          <p className="mt-3 font-family-heading text-xs font-semibold tracking-[0.16em] text-ink/65 uppercase">
            {item.variant?.title ?? item.product_subtitle ?? ""}
          </p>

          <div className="mt-7 flex items-center gap-6">
            <div className="flex h-11 items-stretch border border-ink/70 font-family-heading text-lg font-semibold text-ink">
              <button
                type="button"
                onClick={() => changeQuantity(item.quantity - 1)}
                disabled={updating || item.quantity <= 1}
                className="w-10 border-r border-ink/70 disabled:opacity-30"
              >
                -
              </button>
              <span className="grid w-12 place-items-center">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => changeQuantity(item.quantity + 1)}
                disabled={updating}
                className="w-10 border-l border-ink/70 disabled:opacity-30"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={updating}
              className="font-family-heading text-xs font-extrabold uppercase tracking-[0.18em] text-accent disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        </div>

        <p className="font-family-heading text-3xl sm:text-4xl font-black text-[var(--mc-primary)] sm:pl-4">
          {convertToLocale({
            amount: item.unit_price,
            currency_code: currencyCode,
          })}
        </p>
      </div>
    </article>
  )
}
