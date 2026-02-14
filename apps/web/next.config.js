/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {},
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
