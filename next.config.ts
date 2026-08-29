import type { NextConfig } from "next";
import path from "path";

const WATCH_IGNORED = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/data/**",
  "**/DB backups/**",
  "**/.claude/**",
  // Playwright MCP writes a snapshot/log/screenshot file here on every browser
  // action; without this the dev watcher Fast-Refreshes on each one.
  "**/.playwright-mcp/**",
];

const nextConfig: NextConfig = {
  // NOTE: do not set `output: "standalone"` here. The Hostinger deploy pipeline
  // produces the standalone server itself and copies `.next/static` as part of
  // that step; setting it explicitly makes `next build` emit a standalone tree
  // whose static assets the pipeline then under-copies, which 404s the CSS/JS.

  // mammoth (used by /api/import-docx for .docx -> HTML) does dynamic fs/jszip
  // requires; let it resolve from node_modules at runtime instead of bundling.
  serverExternalPackages: ["mammoth"],
  async redirects() {
    return [
      {
        source: "/articles/topics",
        destination: "/articles?view=topics",
        permanent: true,
      },
      {
        source: "/articles/writers",
        destination: "/articles?view=writers",
        permanent: true,
      },
      {
        source: "/queries/topics",
        destination: "/queries?view=topics",
        permanent: true,
      },
      {
        source: "/queries/writers",
        destination: "/queries?view=writers",
        permanent: true,
      },
      {
        source: "/issues/special",
        destination: "/issues?view=special",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: WATCH_IGNORED,
      };
    }
    return config;
  },
};

export default nextConfig;
