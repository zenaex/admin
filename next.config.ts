import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "upload.wikimedia.org" },
      { hostname: "encrypted-tbn0.gstatic.com" },
      { hostname: "cdn-icons-png.flaticon.com" },
      { hostname: "pub-3dd6cb1fa7314fc68d7278826742c32c.r2.dev" },
      { hostname: "pub-14067d23d5204be98f37c86ea1ee7966.r2.dev" },
      { hostname: "*.r2.dev" },
    ],
  },
};

export default nextConfig;
