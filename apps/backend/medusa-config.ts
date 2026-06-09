import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

// Email delivery: if SendGrid is configured via env, route the "email" channel
// through it for real delivery; otherwise fall back to the local provider,
// which logs notifications to the backend console (zero-config, dev-friendly).
// The local provider always owns the "feed" channel used by admin notifications.
const emailViaSendgrid = !!process.env.SENDGRID_API_KEY;
const notificationProviders: any[] = [
  {
    resolve: "@medusajs/medusa/notification-local",
    id: "local",
    options: {
      name: "Local Notification Provider",
      channels: emailViaSendgrid ? ["feed"] : ["feed", "email"],
    },
  },
];
if (emailViaSendgrid) {
  notificationProviders.push({
    resolve: "@medusajs/medusa/notification-sendgrid",
    id: "sendgrid",
    options: {
      channels: ["email"],
      api_key: process.env.SENDGRID_API_KEY,
      from: process.env.SENDGRID_FROM,
    },
  });
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      // Match the storefront's _medusa_jwt cookie lifetime (7d). The Medusa
      // default is 24h, which is shorter than the cookie — so the cookie (and
      // the force-cached customer) outlives the token and the UI shows a logged
      // in state while authenticated POSTs (e.g. posting a review) 401.
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
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
    {
      // Without this, Medusa registers the local file provider with its default
      // backend_url of http://localhost:9000, so uploaded product images are
      // stored/served as http://localhost:9000/static/... — which the public
      // storefront can't reach (the Next image optimizer fetches its own
      // container, and browsers block public->localhost requests). Point it at
      // the real public API origin so image URLs resolve in production.
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backend_url: `${
                process.env.BACKEND_PUBLIC_URL ?? "http://localhost:9000"
              }/static`,
            },
          },
        ],
      },
    },
    { resolve: "./src/modules/brew" },
    { resolve: "./src/modules/review" },
    { resolve: "./src/modules/coffee-profile" },
    { resolve: "./src/modules/filter-category" },
    { resolve: "./src/modules/contact" },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: notificationProviders,
      },
    },
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
            resolve: "./src/modules/razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
              auto_capture: process.env.RAZORPAY_AUTO_CAPTURE
                ? process.env.RAZORPAY_AUTO_CAPTURE !== "false"
                : undefined,
              webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
});
