"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { CheckIcon } from "@modules/common/icons/monsoon/check"
import type {
  StoreFilterCategory,
  StoreFilterTag,
} from "@lib/data/filter-categories"

type ProductCategoryOption = { id: string; name: string }

type FilterProps = {
  categories: StoreFilterCategory[]
  productCategories?: ProductCategoryOption[]
  className?: string
}

export default function MonsoonFilter({
  categories,
  productCategories = [],
  className = "",
}: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Selected IDs come from the URL — single source of truth. Tags filter via
  // `tag_id`, product categories via `category_id`.
  const selectedTagIds = useMemo(
    () => new Set(searchParams.getAll("tag_id").filter(Boolean)),
    [searchParams]
  )
  const selectedCategoryIds = useMemo(
    () => new Set(searchParams.getAll("category_id").filter(Boolean)),
    [searchParams]
  )

  const setParamSet = useCallback(
    (param: string, next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(param)
      Array.from(next).forEach((id) => params.append(param, id))
      // Reset pagination when filters change.
      params.delete("page")
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `?${qs}` : "?", { scroll: false })
      })
    },
    [router, searchParams]
  )

  const toggleIn = (
    param: string,
    set: Set<string>,
    id: string,
    checked: boolean
  ) => {
    const next = new Set(set)
    if (checked) next.add(id)
    else next.delete(id)
    setParamSet(param, next)
  }

  const toggleTag = (tagId: string, checked: boolean) =>
    toggleIn("tag_id", selectedTagIds, tagId, checked)
  const toggleCategory = (categoryId: string, checked: boolean) =>
    toggleIn("category_id", selectedCategoryIds, categoryId, checked)

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("tag_id")
    params.delete("category_id")
    params.delete("page")
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `?${qs}` : "?", { scroll: false })
    })
  }

  const selectedCount = selectedTagIds.size + selectedCategoryIds.size

  if (!categories.length && !productCategories.length) {
    // Nothing to filter by — render nothing so we don't show an empty rail.
    return null
  }

  return (
    <div className={className} aria-busy={isPending || undefined}>
      <button
        type="button"
        className="flex w-full items-center justify-between border-ink py-4 text-left uppercase lg:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="products-filters"
      >
        <span className="flex items-baseline gap-2 text-lg font-bold tracking-tight text-ink">
          Filters
          {selectedCount > 0 && (
            <span className="border-2 border-accent bg-[rgb(var(--mc-primary-rgb)/0.2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              {selectedCount}
            </span>
          )}
        </span>
        <span className="relative h-5 w-6" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 h-0.5 w-6 bg-ink transition-transform duration-300 ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-2 h-0.5 w-6 bg-ink transition-opacity duration-300 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute left-0 top-4 h-0.5 w-6 bg-ink transition-transform duration-300 ${
              isOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        id="products-filters"
        className={`overflow-hidden transition-all duration-300 ease-out lg:overflow-visible ${
          isOpen
            ? "max-h-[60rem] opacity-100"
            : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
        }`}
      >
        <div className="pt-4 lg:pt-0">
          {selectedCount > 0 && (
            <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-ink/15 pb-3">
              <span className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-ink/60">
                <span className="tabular-nums">{selectedCount}</span> selected
              </span>
              <button
                type="button"
                onClick={clearAll}
                className="font-family-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent underline underline-offset-4 hover:text-ink"
              >
                Clear all
              </button>
            </div>
          )}

          {productCategories.length > 0 && (
            <span className="flex flex-col gap-3 font-family-heading text-ink">
              <span className="my-4 border-b-2 border-ink py-2 text-2xl font-bold tracking-tight">
                Category
              </span>
              {productCategories.map((cat) => (
                <FilterCheckbox
                  key={cat.id}
                  tag={{ id: cat.id, value: cat.name }}
                  checked={selectedCategoryIds.has(cat.id)}
                  onChange={(c) => toggleCategory(cat.id, c)}
                />
              ))}
            </span>
          )}

          {categories.map((category) => (
            <FilterCategorySection
              key={category.id}
              category={category}
              selectedTagIds={selectedTagIds}
              onToggle={toggleTag}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterCategorySection({
  category,
  selectedTagIds,
  onToggle,
}: {
  category: StoreFilterCategory
  selectedTagIds: Set<string>
  onToggle: (tagId: string, checked: boolean) => void
}) {
  if (!category.tags.length) return null

  return (
    <span className="flex flex-col gap-3 font-family-heading text-ink">
      <span className="my-4 border-b-2 border-ink py-2 text-2xl font-bold tracking-tight">
        {category.name}
      </span>
      {category.tags.map((tag) => (
        <FilterCheckbox
          key={tag.id}
          tag={tag}
          checked={selectedTagIds.has(tag.id)}
          onChange={(c) => onToggle(tag.id, c)}
        />
      ))}
    </span>
  )
}

function FilterCheckbox({
  tag,
  checked,
  onChange,
}: {
  tag: StoreFilterTag
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2 text-sm font-light">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded-none border-2 border-ink accent-accent focus:outline-none checked:border-transparent checked:bg-accent"
      />
      <span className="capitalize">{tag.value}</span>
      <CheckIcon className="pointer-events-none absolute h-5 w-5 text-surface opacity-0 peer-checked:opacity-100" />
    </label>
  )
}
