export type Location = { id: string; name: string }

export type Level = {
  id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity?: number
}

export type InventoryItem = {
  id: string
  sku?: string | null
  levels: Level[]
}

export type ManagedVariant = {
  id: string
  title: string
  sku?: string | null
  optionValues: Record<string, string> // option title → value
  inventoryItems: InventoryItem[]
}

export type ManagedProduct = {
  id: string
  title: string
  options: { id: string; title: string; values: string[] }[]
  variants: ManagedVariant[]
  locations: Location[]
}
