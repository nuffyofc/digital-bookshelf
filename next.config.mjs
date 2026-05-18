/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  allowedDevOrigins: ["192.168.1.16"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
