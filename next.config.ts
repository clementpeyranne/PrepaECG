import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb"
    }
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
