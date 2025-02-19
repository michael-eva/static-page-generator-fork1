import { NextResponse, NextRequest } from "next/server";
import { S3Service } from "@/app/services/s3";
import { checkRateLimit } from "@/app/core/security";

const s3 = new S3Service();

type DeleteSiteParams = Promise<{ siteId: string }>;

export async function DELETE(
  request: NextRequest,
  context: { params: DeleteSiteParams }
) {
  try {
    await checkRateLimit(request);

    // await

    const resolvedParams = await context.params;

    
    if (!resolvedParams.siteId) {
      return NextResponse.  json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    await s3.deleteSite(resolvedParams.siteId);
    
    return NextResponse.json({
      message: "Site deleted successfully",
      siteId: resolvedParams.siteId
    }, { status: 200 });

  } catch (error) {
    console.error("Error deleting site:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Permission denied")) {
        return NextResponse.json(
          { error: "Permission denied to delete site" },
          { status: 403 }
        );
      }
      
      if (error.message.includes("Rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}