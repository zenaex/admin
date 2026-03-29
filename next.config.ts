import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "upload.wikimedia.org" },
      { hostname: "encrypted-tbn0.gstatic.com" },
      { hostname: "cdn-icons-png.flaticon.com" },
    ],
  },
};

export default nextConfig;
