import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "undefined",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || "undefined",
    CUSTOM_REGION: process.env.CUSTOM_REGION || "undefined",
  });
}
