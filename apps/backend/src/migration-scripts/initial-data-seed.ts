import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["in"];

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Default Sales Channel",
          description: "Created by Medusa",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Default Store",
          supported_currencies: [
            {
              currency_code: "inr",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries,
          payment_providers: [
            "pp_system_default",
            "pp_phonepe_phonepe",
          ],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Indian Warehouse",
          address: {
            city: "Bengaluru",
            country_code: "IN",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Indian Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "India",
        geo_zones: [
          {
            country_code: "in",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "inr",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "inr",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Whole Beans",
          is_active: true,
        },
        {
          name: "Ground Coffee",
          is_active: true,
        },
        {
          name: "Brew Gear",
          is_active: true,
        },
        {
          name: "Merch",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Monsoon Single Origin",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Whole Beans")!.id,
          ],
          description:
            "Hand-picked Arabica from the Western Ghats, sun-dried on raised beds and roasted in 4kg batches. Tasting notes of dark chocolate, jaggery and stone fruit — a clean, lingering finish that holds up to milk.",
          handle: "monsoon-single-origin",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "/monsoon/images/coffeebags.png" },
            { url: "/monsoon/images/beans.png" },
          ],
          options: [
            { title: "Size", values: ["250g", "500g", "1kg"] },
            { title: "Roast", values: ["Light", "Medium", "Dark"] },
          ],
          variants: [
            {
              title: "250g / Light",
              sku: "MSO-250-LIGHT",
              options: { Size: "250g", Roast: "Light" },
              prices: [{ amount: 650, currency_code: "inr" }],
            },
            {
              title: "250g / Medium",
              sku: "MSO-250-MED",
              options: { Size: "250g", Roast: "Medium" },
              prices: [{ amount: 650, currency_code: "inr" }],
            },
            {
              title: "250g / Dark",
              sku: "MSO-250-DARK",
              options: { Size: "250g", Roast: "Dark" },
              prices: [{ amount: 650, currency_code: "inr" }],
            },
            {
              title: "500g / Light",
              sku: "MSO-500-LIGHT",
              options: { Size: "500g", Roast: "Light" },
              prices: [{ amount: 1200, currency_code: "inr" }],
            },
            {
              title: "500g / Medium",
              sku: "MSO-500-MED",
              options: { Size: "500g", Roast: "Medium" },
              prices: [{ amount: 1200, currency_code: "inr" }],
            },
            {
              title: "500g / Dark",
              sku: "MSO-500-DARK",
              options: { Size: "500g", Roast: "Dark" },
              prices: [{ amount: 1200, currency_code: "inr" }],
            },
            {
              title: "1kg / Light",
              sku: "MSO-1KG-LIGHT",
              options: { Size: "1kg", Roast: "Light" },
              prices: [{ amount: 2200, currency_code: "inr" }],
            },
            {
              title: "1kg / Medium",
              sku: "MSO-1KG-MED",
              options: { Size: "1kg", Roast: "Medium" },
              prices: [{ amount: 2200, currency_code: "inr" }],
            },
            {
              title: "1kg / Dark",
              sku: "MSO-1KG-DARK",
              options: { Size: "1kg", Roast: "Dark" },
              prices: [{ amount: 2200, currency_code: "inr" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Midnight Espresso Blend",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Ground Coffee")!.id,
          ],
          description:
            "A dark, full-bodied espresso blend built for milk drinks. Notes of bittersweet cocoa, molasses and toasted almond. Ground to order — pick your brew method below.",
          handle: "midnight-espresso",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "/monsoon/images/product1.png" },
            { url: "/monsoon/images/Product.png" },
          ],
          options: [
            { title: "Size", values: ["250g", "500g"] },
            {
              title: "Grind",
              values: ["Whole Bean", "Espresso", "French Press", "Pour Over"],
            },
          ],
          variants: [
            {
              title: "250g / Whole Bean",
              sku: "MEB-250-WB",
              options: { Size: "250g", Grind: "Whole Bean" },
              prices: [{ amount: 550, currency_code: "inr" }],
            },
            {
              title: "250g / Espresso",
              sku: "MEB-250-ESP",
              options: { Size: "250g", Grind: "Espresso" },
              prices: [{ amount: 550, currency_code: "inr" }],
            },
            {
              title: "250g / French Press",
              sku: "MEB-250-FP",
              options: { Size: "250g", Grind: "French Press" },
              prices: [{ amount: 550, currency_code: "inr" }],
            },
            {
              title: "250g / Pour Over",
              sku: "MEB-250-PO",
              options: { Size: "250g", Grind: "Pour Over" },
              prices: [{ amount: 550, currency_code: "inr" }],
            },
            {
              title: "500g / Whole Bean",
              sku: "MEB-500-WB",
              options: { Size: "500g", Grind: "Whole Bean" },
              prices: [{ amount: 1000, currency_code: "inr" }],
            },
            {
              title: "500g / Espresso",
              sku: "MEB-500-ESP",
              options: { Size: "500g", Grind: "Espresso" },
              prices: [{ amount: 1000, currency_code: "inr" }],
            },
            {
              title: "500g / French Press",
              sku: "MEB-500-FP",
              options: { Size: "500g", Grind: "French Press" },
              prices: [{ amount: 1000, currency_code: "inr" }],
            },
            {
              title: "500g / Pour Over",
              sku: "MEB-500-PO",
              options: { Size: "500g", Grind: "Pour Over" },
              prices: [{ amount: 1000, currency_code: "inr" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "French Press Carafe",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Brew Gear")!.id,
          ],
          description:
            "A 304-grade stainless steel French press with a double-mesh filter and borosilicate glass jacket. Sturdy, dishwasher-safe, and built to keep your brew hot for the slow morning.",
          handle: "french-press-carafe",
          weight: 900,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "/monsoon/images/productBig.png" },
          ],
          options: [
            { title: "Size", values: ["350ml", "1L"] },
          ],
          variants: [
            {
              title: "350ml",
              sku: "FPC-350",
              options: { Size: "350ml" },
              prices: [{ amount: 1800, currency_code: "inr" }],
            },
            {
              title: "1L",
              sku: "FPC-1L",
              options: { Size: "1L" },
              prices: [{ amount: 2800, currency_code: "inr" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Roaster's Mug",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merch")!.id,
          ],
          description:
            "Heavy ceramic mug, 350ml, hand-pressed in Khurja. Stamped with the Monsoon ledger mark on the base. Microwave and dishwasher safe.",
          handle: "roasters-mug",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "/monsoon/images/about2.png" },
            { url: "/monsoon/images/about3.png" },
          ],
          options: [
            { title: "Color", values: ["Black", "Cream"] },
          ],
          variants: [
            {
              title: "Black",
              sku: "MUG-BLK",
              options: { Color: "Black" },
              prices: [{ amount: 500, currency_code: "inr" }],
            },
            {
              title: "Cream",
              sku: "MUG-CRM",
              options: { Color: "Cream" },
              prices: [{ amount: 500, currency_code: "inr" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
