import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: "/api/urn/image/cryptourn-:urnId.webp",
        destination: "/api/urn/:urnId/image",
      },
      {
        source: "/api/urn/image/cryptourn-:urnId.png",
        destination: "/api/urn/:urnId/image",
      },
    ];
  },
};

export default nextConfig;
