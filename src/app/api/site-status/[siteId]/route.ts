import { NextResponse, NextRequest } from "next/server";
import { S3Service } from "@/app/services/s3";
import { checkRateLimit } from "@/app/core/security";

const s3 = new S3Service();

type GetSiteStatusParams = Promise<{ siteId: string }>;

export async function POST(
  request: NextRequest,
  context: { params: GetSiteStatusParams }
) {
  const resolvedParams = await context.params;

  if (!resolvedParams.siteId) {
    return NextResponse.json(
      { error: "Site ID is required" },
      { status: 400 }
    );
  }    

  try {
    await checkRateLimit(request);
    const status = await s3.getDeploymentStatus(resolvedParams.siteId);
  
    return NextResponse.json({
      site_id: resolvedParams.siteId,
      status,
    });
  } catch (error) {
    console.error("Error getting site status:", error);
    return NextResponse.json(
      { error: "Failed to get site status" },
      { status: 500 }
    );
  }
}
