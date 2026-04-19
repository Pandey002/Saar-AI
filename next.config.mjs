import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // IMPORTANT: Use NetworkFirst for ALL navigation and JS chunks to prevent
  // stale cache poisoning after Vercel deployments. CacheFirst on _next/static
  // causes "This page couldn't load" because the SW serves old JS hashes
  // that no longer exist on the live server.
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-runtime-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 15,
      },
    },
    {
      // Navigation requests (HTML pages) — always try network first
      urlPattern: /^https?.*\/(?!_next\/static)/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // Next.js JS/CSS chunks — NetworkFirst so new deployments always load fresh code
      urlPattern: /^https?.*\/_next\/static\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-static-assets",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 day max — prevents stale poisoning
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // Fonts, images and other true static assets can remain CacheFirst
      urlPattern: /^https?.*\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-media",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  serverExternalPackages: [
    "@google-cloud/vision",
    "@napi-rs/canvas",
    "@napi-rs/canvas-win32-x64-msvc",
    "pdfjs-dist",
    "sharp",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
    ],
  },
};

export default withPWA(nextConfig);
