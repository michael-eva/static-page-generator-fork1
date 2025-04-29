import { CertificateService } from "@/app/services/certificate.service";
import { DNSService } from "@/app/services/dns.service";
import { NextResponse } from "next/server";

export async function validateRequest(request: Request) {
  const { domainName, useRoute53 = false } = await request.json();

  if (!domainName) {
    return {
      error: NextResponse.json(
        { error: "Domain name is required" },
        { status: 400 }
      ),
    };
  }

  return { domainName, useRoute53 };
}

export async function handleCertificateValidation(domainName: string) {
  // Normalize domain name by removing www. if present
  const normalizedDomain = domainName.startsWith("www.")
    ? domainName.slice(4)
    : domainName;
  const wwwDomain = `www.${normalizedDomain}`;

  console.log(
    "[Certificate] Requesting SSL certificate for domains:",
    normalizedDomain,
    wwwDomain
  );
  const certificateArn = await CertificateService.requestCertificate(
    normalizedDomain
  );

  if (!certificateArn) {
    throw new Error("Failed to request SSL certificate");
  }

  let validationResult;
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 5000;

  while (retryCount < maxRetries) {
    try {
      validationResult =
        await CertificateService.getCertificateValidationRecords(
          certificateArn
        );
      if (validationResult.validationRecords) break;
    } catch (error: any) {
      if (error?.message?.includes("not yet available")) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      throw error;
    }
  }

  if (!validationResult?.validationRecords) {
    throw new Error("Failed to get validation records after multiple attempts");
  }

  return { certificateArn, validationResult };
}

export async function handleRoute53Validation(validationResult: any) {
  if (!process.env.HOSTED_ZONE_ID) {
    return NextResponse.json(
      { error: "Hosted zone ID is not configured" },
      { status: 500 }
    );
  }

  await DNSService.createValidationRecords(
    process.env.HOSTED_ZONE_ID,
    validationResult.validationRecords
  );
  return null;
}
