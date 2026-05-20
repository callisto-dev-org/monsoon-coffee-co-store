"use client"

import { useState } from "react"
import { EditProductModal, type EditableProduct } from "./edit-product-modal"
import { ManageVariantsModal } from "./manage-variants-modal"
import { ManageInventoryModal } from "./manage-inventory-modal"
import {
  ManageBrewsModal,
  type BrewMethodLite,
  type BrewRecipeLite,
} from "./manage-brews-modal"
import { ViewReviewsModal } from "./view-reviews-modal"
import type { ManagedProduct } from "./types"

export function ProductActions({
  editable,
  managed,
  currencies,
  brewMethods,
  brewRecipes,
}: {
  editable: EditableProduct
  managed: ManagedProduct
  currencies: string[]
  brewMethods: BrewMethodLite[]
  brewRecipes: BrewRecipeLite[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [variantsOpen, setVariantsOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [brewsOpen, setBrewsOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setVariantsOpen(true)}
          className="border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
        >
          Manage variants
        </button>
        <button
          type="button"
          onClick={() => setBrewsOpen(true)}
          className="border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
        >
          Manage brews
          {brewRecipes.length > 0 && (
            <span className="ml-1.5 inline-block min-w-[18px] border border-mc-ink/30 bg-mc-ink/10 px-1 text-[9px] text-mc-ink">
              {brewRecipes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setReviewsOpen(true)}
          className="border-2 border-mc-ink/30 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-secondary hover:border-mc-ink hover:text-mc-ink"
        >
          View reviews
        </button>
        <button
          type="button"
          onClick={() => setInventoryOpen(true)}
          className="border-2 border-mc-ink bg-mc-ink px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mc-surface hover:bg-mc-accent hover:border-mc-accent"
        >
          Manage inventory
        </button>
      </div>

      <EditProductModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        product={editable}
      />
      <ManageVariantsModal
        open={variantsOpen}
        onClose={() => setVariantsOpen(false)}
        product={managed}
        currencies={currencies}
      />
      <ManageInventoryModal
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        product={managed}
      />
      <ManageBrewsModal
        open={brewsOpen}
        onClose={() => setBrewsOpen(false)}
        productId={managed.id}
        productTitle={managed.title}
        methods={brewMethods}
        recipes={brewRecipes}
      />
      <ViewReviewsModal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        productId={managed.id}
        productTitle={managed.title}
      />
    </>
  )
}
