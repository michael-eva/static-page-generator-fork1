import { NextResponse } from "next/server";
import { DNSService } from "@/app/services/dns.service";

export async function POST(request: Request) {
  try {
    const { domainName, distributionDomain } = await request.json();

    if (!domainName || !distributionDomain) {
      return NextResponse.json(
        { error: "Domain name and distribution domain are required" },
        { status: 400 }
      );
    }

    const result = await DNSService.setupCloudFrontRecords(
      domainName,
      distributionDomain
    );

    return NextResponse.json({
      message: "Route53 records created successfully",
      hostedZoneId: result.hostedZoneId,
      nameservers: result.nameservers,
      records: result.records,
      nextSteps: [
        "Update your domain registrar's nameservers to:",
        ...(result.nameservers || []).map((ns) => `- ${ns}`),
        "This change can take up to 48 hours to propagate globally",
      ],
    });
  } catch (error: any) {
    console.error("[DNS] Error setting up Route53 records:", error);
    return NextResponse.json(
      { error: "Failed to setup Route53 records" },
      { status: 500 }
    );
  }
}
