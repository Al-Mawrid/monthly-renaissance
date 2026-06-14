import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: do not set `output: "standalone"` here. The Hostinger deploy pipeline
  // produces the standalone server itself and copies `.next/static` as part of
  // that step; setting it explicitly makes `next build` emit a standalone tree
  // whose static assets the pipeline then under-copies, which 404s the CSS/JS.
};

export default nextConfig;
