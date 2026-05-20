import "server-only"
import { getRedis } from "./client"

const NAMESPACE = process.env.REDIS_CACHE_NAMESPACE || "monsoon:sf"
const DEFAULT_TTL = Number(process.env.REDIS_CACHE_TTL_SECONDS || 300)

function buildKey(parts: ReadonlyArray<string>): string {
  return [NAMESPACE, ...parts].join(":")
}

export type CacheOptions = {
  ttlSeconds?: number
  swallowErrors?: boolean
}

export async function withCache<T>(
  keyParts: ReadonlyArray<string>,
  loader: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlSeconds = DEFAULT_TTL, swallowErrors = true } = options
  const redis = getRedis()

  if (!redis) return loader()

  const key = buildKey(keyParts)

  try {
    const hit = await redis.get(key)
    if (hit !== null) {
      try {
        return JSON.parse(hit) as T
      } catch {
        // Stale/corrupt entry — fall through to reload
      }
    }
  } catch (err) {
    if (!swallowErrors) throw err
  }

  const fresh = await loader()

  try {
    if (fresh !== undefined && fresh !== null) {
      await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds)
    }
  } catch (err) {
    if (!swallowErrors) throw err
  }

  return fresh
}

export async function invalidateCache(
  keyParts: ReadonlyArray<string>
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(buildKey(keyParts))
  } catch {
    // Best-effort
  }
}

export async function invalidateCachePrefix(
  prefixParts: ReadonlyArray<string>
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const pattern = buildKey([...prefixParts, "*"])
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length) await redis.del(...keys)
    }
  } catch {
    // Best-effort
  }
}
