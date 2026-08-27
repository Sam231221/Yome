const { URL } = require("node:url");

const remotePatterns = [
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
];

const mediaBaseUrl =
  process.env.AWS_CLOUDFRONT_URL || process.env.AWS_S3_PUBLIC_BASE_URL;

if (mediaBaseUrl) {
  try {
    const parsed = new URL(mediaBaseUrl);
    const pathname = parsed.pathname.replace(/\/+$/g, "");

    remotePatterns.push({
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: pathname ? `${pathname}/**` : "/**",
    });
  } catch {
    // Ignore invalid optional media base URL during local bootstrap.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {},
  reactStrictMode: false,
  images: {
    remotePatterns,
  },
};

module.exports = nextConfig;
