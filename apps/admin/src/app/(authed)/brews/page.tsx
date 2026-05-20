import { adminSdk } from "@/lib/medusa"
import { BrewsView } from "./brews-view"
import type { ParamSchemaItem } from "./actions"

export const dynamic = "force-dynamic"

export type BrewMethod = {
  id: string
  slug: string
  name: string
  method_label?: string | null
  summary?: string | null
  image_url?: string | null
  param_schema?: ParamSchemaItem[] | null
  recipe_count?: number
}

async function fetchData(): Promise<{ methods: BrewMethod[] }> {
  const sdk = await adminSdk()
  const res: any = await sdk.client.fetch("/admin/brew-methods")
  const methods: BrewMethod[] = res?.brew_methods || []

  // Count recipes per method so the page can show how widely each one is used.
  const recipeRes: any = await sdk.client.fetch("/admin/brew-recipes")
  const recipes: { brew_method?: { id?: string } }[] =
    recipeRes?.brew_recipes || []
  const counts = new Map<string, number>()
  for (const r of recipes) {
    const id = r.brew_method?.id
    if (!id) continue
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  for (const m of methods) m.recipe_count = counts.get(m.id) || 0

  return { methods }
}

export default async function BrewsPage() {
  const { methods } = await fetchData()
  return <BrewsView methods={methods} />
}
