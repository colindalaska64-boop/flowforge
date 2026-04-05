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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;