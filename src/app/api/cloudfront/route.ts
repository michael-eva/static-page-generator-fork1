import { NextResponse } from "next/server";
import { CloudFrontService } from "@/app/services/cloudfront";
import { AddCloudfrontDomain } from "@/app/services/db";

export async function POST(request: Request) {
  try {
    const { userId, siteId } = await request.json();

    const distribution = await CloudFrontService.createDistribution({
      userId,
      siteId,
    });
    if (distribution?.DomainName) {
      await AddCloudfrontDomain({
        domain: distribution.DomainName,
        siteId,
      });
    }
    return NextResponse.json({ distribution });
  } catch (error) {
    console.error("Error creating CloudFront distribution:", error);
    return NextResponse.json(
      { error: "Failed to create CloudFront distribution" },
      { status: 500 }
    );
  }
}
