"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { withCache } from "@lib/redis/with-cache"
import { getCacheOptions } from "./cookies"

const COLLECTIONS_TTL = 60 * 15

export const retrieveCollection = async (id: string) =>
  withCache(
    ["collections", "id", id],
    async () => {
      const next = { ...(await getCacheOptions("collections")) }
      return sdk.client
        .fetch<{ collection: HttpTypes.StoreCollection }>(
          `/store/collections/${id}`,
          { next, cache: "force-cache" }
        )
        .then(({ collection }) => collection)
    },
    { ttlSeconds: COLLECTIONS_TTL }
  )

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return withCache(
    ["collections", "list", queryParams.limit, queryParams.offset],
    async () => {
      const next = { ...(await getCacheOptions("collections")) }
      return sdk.client
        .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
          "/store/collections",
          { query: queryParams, next, cache: "force-cache" }
        )
        .then(({ collections }) => ({ collections, count: collections.length }))
    },
    { ttlSeconds: COLLECTIONS_TTL }
  )
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> =>
  withCache(
    ["collections", "handle", handle],
    async () => {
      const next = { ...(await getCacheOptions("collections")) }
      return sdk.client
        .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
          query: { handle, fields: "*products" },
          next,
          cache: "force-cache",
        })
        .then(({ collections }) => collections[0] || null)
    },
    { ttlSeconds: COLLECTIONS_TTL }
  )
