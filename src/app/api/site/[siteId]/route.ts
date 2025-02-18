import { NextResponse } from "next/server";
import { S3Service } from "@/app/services/s3";
import { checkRateLimit } from "@/app/core/security";

const s3 = new S3Service();

export async function DELETE(
  request: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    await checkRateLimit(request);
    
    await s3.deleteSite(params.siteId);
    
    return NextResponse.json({
      message: "Site deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
} 