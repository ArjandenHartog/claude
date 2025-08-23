import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    esmExternals: false,
  },
  webpack: (config, { isServer }) => {
    // Handle xterm.js properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      };
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src/app'),
    };
    
    return config;
  },
  transpilePackages: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
};

export default nextConfig;
