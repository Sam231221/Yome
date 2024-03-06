/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: 481623770,
    NEXT_PUBLIC_ZEGO_SERVER_ID: "3901bf1c99551de036ef8a2cd22eddde",
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "scontent.fpkr1-1.fna.fbcdn.net",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "bootstrapmade.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "th.bing.com",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
