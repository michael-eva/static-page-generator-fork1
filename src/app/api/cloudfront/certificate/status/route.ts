import { NextResponse } from "next/server";
import { CertificateService } from "@/app/services/certificate.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateArn = searchParams.get("certificateArn");
    const domainName = searchParams.get("domainName");

    if (!certificateArn || !domainName) {
      return NextResponse.json(
        { error: "Certificate ARN and domain name are required" },
        { status: 400 }
      );
    }

    const result = await CertificateService.getCertificateValidationRecords(
      certificateArn
    );
    return NextResponse.json({
      status: result.status,
      validationRecords: result.validationRecords,
    });
  } catch (error: any) {
    console.error(
      "[Certificate Status] Error checking certificate status:",
      error
    );
    return NextResponse.json(
      { error: "Failed to check certificate status" },
      { status: 500 }
    );
  }
}
