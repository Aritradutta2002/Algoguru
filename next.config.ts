import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/java-roadmap",
        destination: "/roadmap/java",
        permanent: false,
      },
    ];
  },
  // Native Turbopack is enabled by default in Next 16 (`turbopack: {}` silences
  // the webpack-without-turbopack guard), while the client-only webpack fallback
  // keeps Node built-ins disabled if `--webpack` is invoked.
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
