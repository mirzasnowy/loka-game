/** @type {import('next').NextConfig} */
const nextConfig = {
  // R3F double-invokes effects under StrictMode in dev; off for a game loop.
  reactStrictMode: false,
  transpilePackages: ["three"],
};

export default nextConfig;
