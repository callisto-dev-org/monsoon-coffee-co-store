import "server-only"
import Redis from "ioredis"

declare global {
  // eslint-disable-next-line no-var
  var __monsoonRedis: Redis | null | undefined
  // eslint-disable-next-line no-var
  var __monsoonRedisDisabled: boolean | undefined
}

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379"

function createClient(): Redis | null {
  if (globalThis.__monsoonRedisDisabled) return null

  try {
    const client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1500,
      commandTimeout: 800,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    })

    client.on("error", (err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[redis] error:", err.message)
      }
    })

    return client
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[redis] init failed, disabling cache:", err)
    }
    globalThis.__monsoonRedisDisabled = true
    return null
  }
}

export function getRedis(): Redis | null {
  if (globalThis.__monsoonRedis === undefined) {
    globalThis.__monsoonRedis = createClient()
  }
  return globalThis.__monsoonRedis ?? null
}
