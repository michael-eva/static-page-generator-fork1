import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    CUSTOM_REGION: process.env.CUSTOM_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    CUSTOM_ACCESS_KEY_ID: process.env.CUSTOM_ACCESS_KEY_ID,
    CUSTOM_SECRET_ACCESS_KEY: process.env.CUSTOM_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_PROJECT_LIMIT: process.env.NEXT_PUBLIC_PROJECT_LIMIT,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    NEXT_PUBLIC_CUSTOM_REGION: process.env.NEXT_PUBLIC_CUSTOM_REGION,
    API_TITLE: process.env.API_TITLE,
    API_VERSION: process.env.API_VERSION,
    DEBUG: process.env.DEBUG,
    ENVIRONMENT: process.env.ENVIRONMENT,
    API_KEY_HEADER: process.env.API_KEY_HEADER,
    API_KEY: process.env.API_KEY,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    RATE_LIMIT_CALLS: process.env.RATE_LIMIT_CALLS,
    RATE_LIMIT_PERIOD: process.env.RATE_LIMIT_PERIOD,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_FORMAT: process.env.LOG_FORMAT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "myaisitebuilder.s3.us-east-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
