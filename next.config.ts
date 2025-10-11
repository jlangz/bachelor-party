import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // During builds, only fail on errors, not warnings
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't type-check during production builds (it's already done in lint step)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
