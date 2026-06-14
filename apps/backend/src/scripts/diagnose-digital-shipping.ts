import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only inspection of the shipping configuration that decides whether a
 * mixed cart (physical + digital/event-ticket) can be completed.
 *
 * Cart completion throws "cart items require shipping profiles that are not
 * satisfied by the current shipping methods" when a required shipping profile
 * has no shipping method. A profile only gets a method if `/store/shipping-
 * options?cart_id=` returns an option for it — which requires the option to be
 * (a) store-enabled (`enabled_in_store=true`) and (b) in a service zone whose
 * geo zones cover the cart's shipping-address country.
 *
 * Run: npx medusa exec ./src/scripts/diagnose-digital-shipping.ts
 */
export default async function diagnoseDigitalShipping({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
  })
  logger.info(`Shipping profiles (${profiles.length}):`)
  for (const p of profiles) {
    logger.info(`  • ${p.name} [type=${p.type}] (${p.id})`)
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "shipping_profile.id",
      "shipping_profile.name",
      "service_zone.id",
      "service_zone.name",
      "service_zone.geo_zones.country_code",
      "service_zone.fulfillment_set.name",
      "service_zone.fulfillment_set.location.id",
      "rules.attribute",
      "rules.operator",
      "rules.value",
    ],
  })

  logger.info(`\nShipping options (${options.length}):`)
  for (const o of options as Array<Record<string, any>>) {
    const geos =
      (o.service_zone?.geo_zones ?? [])
        .map((g: any) => g.country_code)
        .join(", ") || "(none)"
    const rules =
      (o.rules ?? [])
        .map((r: any) => `${r.attribute}${r.operator === "eq" ? "=" : r.operator}${r.value}`)
        .join(", ") || "(none)"
    const storeEnabled = (o.rules ?? []).some(
      (r: any) => r.attribute === "enabled_in_store" && String(r.value) === "true"
    )
    logger.info(
      [
        `  • "${o.name}" [${o.price_type}] provider=${o.provider_id}`,
        `      profile: ${o.shipping_profile?.name} (${o.shipping_profile?.id})`,
        `      zone: ${o.service_zone?.name} | geo: ${geos} | fset: ${o.service_zone?.fulfillment_set?.name} | location: ${o.service_zone?.fulfillment_set?.location?.id ?? "(none)"}`,
        `      rules: ${rules}`,
        `      => store-visible for India cart? ${
          storeEnabled && geos.split(", ").includes("in") ? "YES" : "NO"
        }`,
      ].join("\n")
    )
  }
}
