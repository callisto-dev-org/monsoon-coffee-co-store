"use server"

import { sdk } from "@lib/config"

export type StoreFilterTag = {
  id: string
  value: string
}

export type StoreFilterCategory = {
  id: string
  name: string
  handle: string
  rank: number
  tags: StoreFilterTag[]
}

export const listFilterCategories = async (): Promise<StoreFilterCategory[]> => {
  try {
    const res = await sdk.client.fetch<{
      filter_categories: StoreFilterCategory[]
    }>(`/store/filter-categories`, {
      method: "GET",
      cache: "no-store",
    })
    return res.filter_categories ?? []
  } catch {
    return []
  }
}
