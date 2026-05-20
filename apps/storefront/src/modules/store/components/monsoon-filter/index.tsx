"use client"

import { useState } from "react"
import { CheckIcon } from "@modules/common/icons/monsoon/check"

type FilterProps = {
  className?: string
}

export default function MonsoonFilter({ className = "" }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={className}>
      <button
        type="button"
        className="flex w-full items-center justify-between border-ink py-4 text-left uppercase lg:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="products-filters"
      >
        <span className="text-lg font-bold tracking-tight text-ink">
          Filters
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
            ? "max-h-[40rem] opacity-100"
            : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
        }`}
      >
        <div className="pt-4 lg:pt-0">
          <FilterCategory
            name="Roast Level"
            options={["Light Roast", "Medium Roast", "Dark Roast"]}
          />
          <FilterCategory
            name="Origin"
            options={["Africa", "Asia", "Asia Pacific"]}
          />
          <FilterCategory
            name="Process"
            options={["Washed", "Natural", "Honey", "Aerobic"]}
          />
        </div>
      </div>
    </div>
  )
}

function FilterCategory({
  name,
  options,
}: {
  name: string
  options: string[]
}) {
  return (
    <span className="flex flex-col font-family-heading text-ink gap-4">
      <span className="py-2 border-b-2 border-ink text-2xl font-bold tracking-tight my-4">
        {name}
      </span>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 relative text-sm font-light cursor-pointer"
        >
          <input
            type="checkbox"
            className="w-5 h-5 accent-accent rounded-none appearance-none border-2 peer focus:outline-none cursor-pointer border-ink checked:border-transparent checked:bg-accent"
          />
          {option}
          <CheckIcon className="absolute h-5 w-5 text-surface opacity-0 peer-checked:opacity-100 pointer-events-none" />
        </label>
      ))}
    </span>
  )
}
