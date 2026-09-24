import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // Eight MiB images need about 10.7 MiB after base64 encoding. Route readers
  // enforce their own smaller limits before parsing.
  experimental: { proxyClientMaxBodySize: "12mb", mcpServer: false },
};

export default nextConfig;
