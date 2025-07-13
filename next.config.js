/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'wydhzaicymzxjesvaorw.supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com'
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      "fs": false,
      "net": false,
      "dns": false,
      "child_process": false,
      "tls": false,
      "webworker-threads": false,
    };
    
    // Ignore natural.js server-side modules that cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'webworker-threads': false,
    };
    
    return config;
  },
}

module.exports = nextConfig
