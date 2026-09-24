import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['72.62.86.69'],
  cacheComponents: true,
  images: {
    localPatterns: [
      {
        pathname: '/api/proxy-image',
      },
    ],
  },
};

export default nextConfig;
