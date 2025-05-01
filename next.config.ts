import type { NextConfig } from "next";
console.log("ENV CHECK - S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME);
console.log(
  "ENV CHECK - SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const nextConfig: NextConfig = {
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
