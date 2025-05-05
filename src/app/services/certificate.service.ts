import {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
} from "@aws-sdk/client-acm";

// CloudFront requires certificates to be in us-east-1
const acmClient = new ACMClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});

export interface CertificateValidationRecord {
  domainName: string;
  validationRecord: {
    Name: string;
    Type: string;
    Value: string;
  };
  status: string;
}

export interface CertificateValidationResult {
  validationRecords: CertificateValidationRecord[];
  status: string;
}

export class CertificateService {
  /**
   * Requests an SSL certificate for the domain
   */
  static async requestCertificate(domainName: string): Promise<string> {
    try {
      const command = new RequestCertificateCommand({
        DomainName: domainName,
        ValidationMethod: "DNS",
        SubjectAlternativeNames: [`www.${domainName}`],
      });

      const response = await acmClient.send(command);
      if (!response.CertificateArn) {
        throw new Error("Failed to get certificate ARN");
      }
      return response.CertificateArn;
    } catch (error) {
      console.error("Error requesting SSL certificate:", error);
      throw error;
    }
  }

  /**
   * Gets the validation records for an ACM certificate
   */
  static async getCertificateValidationRecords(
    certificateArn: string
  ): Promise<CertificateValidationResult> {
    try {
      const command = new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      });

      const response = await acmClient.send(command);
      const certificate = response.Certificate;

      if (!certificate) {
        throw new Error("Certificate not found");
      }

      // Check if validation records are available
      if (!certificate.DomainValidationOptions?.length) {
        throw new Error(
          "Validation records not yet available. Please try again in a few minutes."
        );
      }

      const validationRecords = certificate.DomainValidationOptions.map(
        (option) => {
          if (!option.ResourceRecord) {
            throw new Error(
              "Validation record not yet available. Please try again in a few minutes."
            );
          }
          return {
            domainName: option.DomainName!,
            validationRecord: {
              Name: option.ResourceRecord.Name!,
              Type: option.ResourceRecord.Type!,
              Value: option.ResourceRecord.Value!,
            },
            status: option.ValidationStatus!,
          };
        }
      );

      return {
        validationRecords,
        status: certificate.Status!,
      };
    } catch (error) {
      console.error("Error getting certificate validation records:", error);
      throw error;
    }
  }

  /**
   * Polls the certificate status until it's validated
   */
  static async waitForCertificateValidation(
    certificateArn: string,
    interval = 30000,
    maxAttempts = 20
  ): Promise<CertificateValidationResult> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.getCertificateValidationRecords(certificateArn);

      if (result.status === "ISSUED") {
        return result;
      }

      if (result.status === "FAILED") {
        throw new Error("Certificate validation failed");
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Certificate validation timed out");
  }
}
