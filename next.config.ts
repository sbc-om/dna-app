import type { NextConfig } from "next";
import withPWA from '@ducanh2912/next-pwa';

const lowResourceMode = process.env.LOW_RESOURCE_MODE === 'true';
const envAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// NOTE:
// Next.js is tightening dev-mode security around cross-origin requests for /_next assets.
// When developing behind a proxy, on a LAN IP, or via an alternative hostname, configure
// allowed dev origins to avoid CORS-related dev breakage.
const allowedDevOrigins = process.env.NODE_ENV === 'development'
  ? [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      ...envAllowedDevOrigins,
    ]
  : undefined;

const nextConfig: NextConfig = {
  // Next.js automatically detects src/ directory
  // Set turbopack root to current project directory
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins,
  serverExternalPackages: ['lmdb', 'argon2', 'cbor-x', 'msgpackr'],
  
  // Minimal caching (Next.js requires static to be at least 30)
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default withPWA({
  dest: 'public',
  disable: lowResourceMode || process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
  },
})(nextConfig);
