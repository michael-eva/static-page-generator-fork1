import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/app/services/s3";
import { checkRateLimit } from "@/app/core/security";

const s3 = new S3Service();

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    await checkRateLimit(request);
    const siteId = params.siteId;

    // Wrap in Promise.resolve() to satisfy type constraints
    const status = await Promise.resolve().then(async () => {
      return await s3.getDeploymentStatus(siteId);
    });

    return NextResponse.json({
      site_id: siteId,
      status
    });
  } catch (error) {
    console.error("Error getting site status:", error);
    return NextResponse.json(
      { error: "Failed to get site status" },
      { status: 500 }
    );
  }
} 