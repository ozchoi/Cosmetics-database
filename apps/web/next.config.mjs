/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: [
    "@cosmetic-lens/shared",
    "@cosmetic-lens/ingredient-parser",
    "@cosmetic-lens/scoring",
    "@cosmetic-lens/ocr",
    "@cosmetic-lens/storage",
  ],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
