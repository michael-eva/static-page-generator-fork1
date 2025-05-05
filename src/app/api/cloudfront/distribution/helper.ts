import { CertificateService } from "@/app/services/certificate.service";
import { CloudFrontService } from "@/app/services/cloudfront";

export interface ValidationRecord {
  domainName: string;
  validationRecord: {
    Name: string;
    Type: string;
    Value: string;
  };
  status: string;
}

export interface Distribution {
  Id: string;
  DomainName?: string;
  Status?: string;
  ARN?: string;
}

export interface StatusResponse {
  status: string;
  validationRecords: ValidationRecord[];
  distribution?: Distribution;
  message?: string;
  error?: string;
}

export async function validateCertificate(
  certificateArn: string,
  domainName: string
): Promise<{ status: string; validationRecords: ValidationRecord[] }> {
  const result = await CertificateService.getCertificateValidationRecords(
    certificateArn
  );

  console.log(`[Certificate Status] Validation status for ${domainName}:`, {
    status: result.status,
    validationRecords: result.validationRecords,
  });

  result.validationRecords.forEach((record, index) => {
    console.log(`[Certificate Status] Record ${index + 1} for ${domainName}:`, {
      domain: record.domainName,
      recordName: record.validationRecord.Name,
      recordType: record.validationRecord.Type,
      recordValue: record.validationRecord.Value,
      status: record.status,
    });
  });

  return result;
}

export async function handleDistributionSetup(
  siteId: string,
  userId: string,
  domainName: string,
  certificateArn: string
): Promise<Distribution> {
  try {
    let distribution;

    // Check for existing distribution
    try {
      const distributionStatus = await CloudFrontService.getDistributionStatus(
        siteId
      );
      if (distributionStatus) {
        distribution = { Id: siteId };
      }
    } catch (error: any) {
      if (error?.Code === "NoSuchDistribution") {
        // Normalize domain name
        const normalizedDomain = domainName.startsWith("www.")
          ? domainName.slice(4)
          : domainName;
        const wwwDomain = `www.${normalizedDomain}`;

        // Create new distribution
        distribution = await CloudFrontService.createDistribution({
          userId,
          siteId,
          certificateArn,
          domainNames: [normalizedDomain, wwwDomain],
        });

        if (!distribution?.DomainName) {
          throw new Error("Failed to create CloudFront distribution");
        }
      } else {
        throw error;
      }
    }

    // Update distribution if needed
    if (distribution && !distribution.DomainName) {
      const updatedDistribution = await CloudFrontService.updateDistribution(
        distribution.Id,
        {
          Aliases: {
            Quantity: 1,
            Items: [domainName],
          },
          ViewerCertificate: {
            ACMCertificateArn: certificateArn,
            SSLSupportMethod: "sni-only",
            MinimumProtocolVersion: "TLSv1.2_2021",
          },
        }
      );

      if (!updatedDistribution?.DomainName) {
        throw new Error("Failed to update CloudFront distribution");
      }
      distribution = updatedDistribution;
    }

    return distribution;
  } catch (error: any) {
    console.error("[Distribution] Error in distribution setup:", {
      error: error.message,
      code: error.Code,
      stack: error.stack,
    });
    throw error;
  }
}
