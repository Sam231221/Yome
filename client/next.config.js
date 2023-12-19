/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: 1120214983,
    NEXT_PUBLIC_ZEGO_SERVER_ID: "a5294b1466b2729c38e0a7703961e9c0",
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
