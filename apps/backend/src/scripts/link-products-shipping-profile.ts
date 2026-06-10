import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

/**
 * Backfill the product ↔ shipping-profile link for any products that are
 * missing it. Medusa's cart-completion workflow refuses to create an order
 * when a cart item's product has no shipping profile satisfied by the chosen
 * shipping method ("cart items require shipping profiles…"). Products created
 * through the admin without a shipping profile selected hit exactly that.
 *
 * Run: npx medusa exec ./src/scripts/link-products-shipping-profile.ts
 */
export default async function linkProductsShippingProfile({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })
  if (!profiles.length) {
    logger.error("No shipping profile found — seed the store first.")
    return
  }
  const defaultProfile =
    profiles.find((p) => p.name === "Default Shipping Profile") ?? profiles[0]

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "shipping_profile.id"],
  })

  const missing = products.filter((p) => !p.shipping_profile?.id)
  if (!missing.length) {
    logger.info("All products already have a shipping profile. Nothing to do.")
    return
  }

  logger.info(
    `Linking ${missing.length} product(s) to "${defaultProfile.name}"…`
  )

  await link.create(
    missing.map((p) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      [Modules.FULFILLMENT]: { shipping_profile_id: defaultProfile.id },
    }))
  )

  logger.info(
    `Linked: ${missing.map((p) => p.title).join(", ")}`
  )
}
