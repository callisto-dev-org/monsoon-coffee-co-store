import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Pings the storefront's /api/revalidate route after any product mutation so
 * Next.js drops its cached product/region payloads. Keeps the storefront in
 * sync with the Medusa Admin without forcing the merchant to restart.
 */
export default async function storefrontRevalidate({
  event,
  container,
}: SubscriberArgs<{ id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  if (!url || !secret) {
    logger.debug(
      "storefront-revalidate: STOREFRONT_REVALIDATE_URL / _SECRET not set; skipping."
    )
    return
  }

  const payload = {
    event: event.name,
    product_id: event.data?.id,
    tags: ["products", event.data?.id ? `product-${event.data.id}` : null].filter(
      Boolean
    ),
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      logger.warn(
        `storefront-revalidate: ${url} returned ${res.status} for ${event.name}`
      )
    }
  } catch (e) {
    logger.warn(
      `storefront-revalidate: failed to ping storefront — ${
        (e as Error).message
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
