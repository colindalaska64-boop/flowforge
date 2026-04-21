import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: ["pg", "pg-native", "imapflow", "nodemailer"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ces modules Node.js ne doivent jamais être bundlés côté client
      config.resolve.alias = {
        ...config.resolve.alias,
        pg: false,
        "pg-native": false,
        imapflow: false,
        nodemailer: false,
      };
    }
    return config;
  },
  async headers() {
    // CSP : on autorise explicitement les domaines nécessaires (GTM, GA4, etc.)
    // unsafe-inline requis pour les styles React + JSON-LD inline
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",        value: csp },
          { key: "X-Frame-Options",                value: "DENY" },
          { key: "X-Content-Type-Options",          value: "nosniff" },
          { key: "Referrer-Policy",                 value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",              value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security",       value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;