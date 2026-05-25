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
