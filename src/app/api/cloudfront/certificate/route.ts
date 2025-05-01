import { NextResponse } from "next/server";
import { CertificateService } from "@/app/services/certificate.service";
import {
  handleCertificateValidation,
  handleRoute53Validation,
  validateRequest,
} from "./helper";

export async function POST(request: Request) {
  console.log("[Certificate] Starting certificate creation process");
  try {
    // 1. Validate request
    const validationResult = await validateRequest(request);
    if ("error" in validationResult) return validationResult.error;
    const { domainName, useRoute53 } = validationResult;

    // 2. Handle certificate validation
    const { certificateArn, validationResult: certValidation } =
      await handleCertificateValidation(domainName);

    // 3. Handle Route53 validation if needed
    if (useRoute53) {
      const route53Error = await handleRoute53Validation(certValidation);
      if (route53Error) return route53Error;
    } else {
      return NextResponse.json({
        message:
          "Please add these DNS records to validate your SSL certificate",
        validationRecords: certValidation.validationRecords,
        nextSteps: [
          "Add the validation records to your DNS provider",
          "Wait for certificate validation (can take up to 30 minutes)",
        ],
        certificateArn: certificateArn,
      });
    }

    // 4. Wait for certificate validation
    await CertificateService.waitForCertificateValidation(certificateArn);

    return NextResponse.json({
      certificateArn,
      message: useRoute53
        ? "Certificate created and validated successfully"
        : "Please follow the instructions to complete certificate validation",
    });
  } catch (error) {
    console.error(
      "[Certificate] Error in certificate creation process:",
      error
    );
    return NextResponse.json(
      { error: "Failed to create SSL certificate" },
      { status: 500 }
    );
  }
}
