const path = require("path")
const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained `.next/standalone` output for Docker.
  // See https://nextjs.org/docs/app/getting-started/deploying#docker
  output: "standalone",
  // Monorepo: trace files from the repo root so workspace deps resolve.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "lodash",
      "@medusajs/icons",
      "@medusajs/ui",
      "@headlessui/react",
      "@radix-ui/react-accordion",
      "react-country-flag",
    ],
  },
  serverExternalPackages: ["ioredis"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [{ protocol: "https", hostname: S3_HOSTNAME, pathname: S3_PATHNAME }]
        : []),
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
