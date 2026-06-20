/** @type {import('next').NextConfig} */
const nextConfig = {
  // R3F double-invokes effects under StrictMode in dev; off for a game loop.
  reactStrictMode: false,
  transpilePackages: ["three"],
  // Static export for Cloudflare Pages deployment.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
