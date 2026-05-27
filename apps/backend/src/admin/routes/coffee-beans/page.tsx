import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container } from "@medusajs/ui"
import { useState } from "react"
import { BeansTab } from "./tab-beans"
import { TaggingCategoriesTab } from "./tab-tagging-categories"
import { BrewLabsTab } from "./tab-brew-labs"
import { CoffeeProfileTab } from "./tab-coffee-profile"

export type TabKey = "beans" | "tagging" | "brew-labs" | "coffee-profile"

const TABS: { key: TabKey; label: string }[] = [
  { key: "beans", label: "Beans" },
  { key: "tagging", label: "Tagging categories" },
  { key: "brew-labs", label: "Brew labs" },
  { key: "coffee-profile", label: "Coffee profile" },
]

const CoffeeBeansPage = () => {
  const [active, setActive] = useState<TabKey>("beans")

  return (
    <Container className="p-0">
      <nav className="flex gap-1 overflow-x-auto border-b border-ui-border-base px-3 pt-3">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`relative shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-ui-fg-base"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 bg-ui-fg-base" />
              )}
            </button>
          )
        })}
      </nav>

      {active === "beans" && (
        <BeansTab onSwitchTab={(t) => setActive(t)} />
      )}
      {active === "tagging" && <TaggingCategoriesTab />}
      {active === "brew-labs" && <BrewLabsTab />}
      {active === "coffee-profile" && <CoffeeProfileTab />}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Coffee Beans",
})

export default CoffeeBeansPage
