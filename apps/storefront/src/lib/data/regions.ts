"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { withCache } from "@lib/redis/with-cache"
import { getCacheOptions } from "./cookies"

const REGION_TTL = 60 * 30

export const listRegions = async () =>
  withCache(
    ["regions", "list"],
    async () => {
      const next = { ...(await getCacheOptions("regions")) }
      return sdk.client
        .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
          method: "GET",
          next,
          cache: "force-cache",
        })
        .then(({ regions }) => regions)
    },
    { ttlSeconds: REGION_TTL }
  )

export const retrieveRegion = async (id: string) =>
  withCache(
    ["regions", "id", id],
    async () => {
      const next = { ...(await getCacheOptions(["regions", id].join("-"))) }
      return sdk.client
        .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
          method: "GET",
          next,
          cache: "force-cache",
        })
        .then(({ region }) => region)
    },
    { ttlSeconds: REGION_TTL }
  )

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  if (regionMap.has(countryCode)) {
    return regionMap.get(countryCode)
  }

  const regions = await listRegions()
  if (!regions) {
    return null
  }

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      regionMap.set(c?.iso_2 ?? "", region)
    })
  })

  return countryCode ? regionMap.get(countryCode) : regionMap.get("us")
}
