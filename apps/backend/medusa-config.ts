import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    cookieOptions: {
      sameSite: "lax",
      secure: false,
    },
  },
  admin: {
    vite: (config) => {
      return {
        server: {
          host: "0.0.0.0",
          allowedHosts: ["localhost", ".localhost", "127.0.0.1"],
          hmr: {
            port: 5173,
            clientPort: 5173,
          },
        },
      };
    },
  },
  modules: [
    { resolve: "./src/modules/brew" },
    { resolve: "./src/modules/review" },
    { resolve: "./src/modules/coffee-profile" },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/shipmozo",
            id: "shipmozo",
            options: {
              public_key: process.env.SHIPMOZO_PUBLIC_KEY,
              private_key: process.env.SHIPMOZO_PRIVATE_KEY,
              environment:
                (process.env.SHIPMOZO_ENV as
                  | "sandbox"
                  | "production"
                  | undefined) ?? "sandbox",
              warehouse_id: process.env.SHIPMOZO_WAREHOUSE_ID,
              warehouse_pincode: process.env.SHIPMOZO_WAREHOUSE_PINCODE,
              default_courier_id: process.env.SHIPMOZO_DEFAULT_COURIER_ID,
              default_package_type:
                process.env.SHIPMOZO_PACKAGE_TYPE ?? "SPS",
              default_rov_type:
                process.env.SHIPMOZO_ROV_TYPE ?? "ROV_OWNER",
              default_return_reason_id: process.env.SHIPMOZO_RETURN_REASON_ID
                ? Number(process.env.SHIPMOZO_RETURN_REASON_ID)
                : undefined,
              default_weight_g: process.env.SHIPMOZO_DEFAULT_WEIGHT_G
                ? Number(process.env.SHIPMOZO_DEFAULT_WEIGHT_G)
                : undefined,
              default_length_cm: process.env.SHIPMOZO_DEFAULT_LENGTH_CM
                ? Number(process.env.SHIPMOZO_DEFAULT_LENGTH_CM)
                : undefined,
              default_breadth_cm: process.env.SHIPMOZO_DEFAULT_BREADTH_CM
                ? Number(process.env.SHIPMOZO_DEFAULT_BREADTH_CM)
                : undefined,
              default_height_cm: process.env.SHIPMOZO_DEFAULT_HEIGHT_CM
                ? Number(process.env.SHIPMOZO_DEFAULT_HEIGHT_CM)
                : undefined,
              tracking_url_template:
                process.env.SHIPMOZO_TRACKING_URL_TEMPLATE,
              cod_payment_provider_ids:
                process.env.SHIPMOZO_COD_PAYMENT_PROVIDER_IDS
                  ? process.env.SHIPMOZO_COD_PAYMENT_PROVIDER_IDS.split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : undefined,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/phonepe",
            id: "phonepe",
            options: {
              client_id: process.env.PHONEPE_CLIENT_ID,
              client_secret: process.env.PHONEPE_CLIENT_SECRET,
              client_version: process.env.PHONEPE_CLIENT_VERSION ?? 1,
              environment:
                (process.env.PHONEPE_ENV as
                  | "sandbox"
                  | "production"
                  | undefined) ?? "sandbox",
              storefront_url:
                process.env.STOREFRONT_URL ?? "http://localhost:8000",
              webhook_username: process.env.PHONEPE_WEBHOOK_USERNAME,
              webhook_password: process.env.PHONEPE_WEBHOOK_PASSWORD,
            },
          },
        ],
      },
    },
  ],
});
