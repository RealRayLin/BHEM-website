import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Fix for PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    return config;
  },
  // Ensure static files are served correctly
  async headers() {
    return [
      {
        source: '/pdf/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
