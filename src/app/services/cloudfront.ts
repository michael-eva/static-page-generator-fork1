import {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand,
  UpdateDistributionCommand,
  ViewerProtocolPolicy,
  ItemSelection,
  PriceClass,
  SSLSupportMethod,
  MinimumProtocolVersion,
  CreateCloudFrontOriginAccessIdentityCommand,
} from "@aws-sdk/client-cloudfront";
import { ACMClient, RequestCertificateCommand } from "@aws-sdk/client-acm";
import { S3Client, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

const region = process.env.CUSTOM_REGION;

const cloudfrontClient = new CloudFrontClient({
  region,
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});
const acmClient = new ACMClient({
  region,
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY ?? "",
  },
});

interface CreateDistributionParams {
  userId: string;
  siteId: string;
}

export class CloudFrontService {
  /**
   * Creates a new CloudFront distribution for a user's static site
   */
  static async createDistribution({
    userId,
    siteId,
  }: CreateDistributionParams) {
    try {
      // Setup OAI and bucket policy
      const oaiId = await this.setupOriginAccessIdentity(
        `default-${userId}`,
        userId
      );

      // First, request an SSL certificate for the domain
      //   const certificateArn = await this.requestCertificate(domainName);

      // Create the distribution configuration
      const distributionConfig = {
        CallerReference: `${userId}-${Date.now()}`,
        Comment: `Distribution for user ${userId}`,
        DefaultRootObject: "index.html",
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `${process.env.S3_BUCKET_NAME}-origin`,
              DomainName: `${process.env.S3_BUCKET_NAME}.s3.${process.env.CUSTOM_REGION}.amazonaws.com`,
              OriginPath: `/${siteId}`,
              S3OriginConfig: {
                OriginAccessIdentity: `origin-access-identity/cloudfront/${oaiId}`,
              },
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: `${process.env.S3_BUCKET_NAME}-origin`,
          ForwardedValues: {
            QueryString: false,
            Cookies: {
              Forward: ItemSelection.none,
            },
          },
          ViewerProtocolPolicy: ViewerProtocolPolicy.redirect_to_https,
          MinTTL: 0,
        },
        ViewerCertificate: {
          CloudFrontDefaultCertificate: true,
          SSLSupportMethod: SSLSupportMethod.sni_only,
          MinimumProtocolVersion: MinimumProtocolVersion.TLSv1_2_2021,
        },
        PriceClass: PriceClass.PriceClass_100, // Use all edge locations
        Enabled: true,
      };

      const command = new CreateDistributionCommand({
        DistributionConfig: distributionConfig,
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution;
    } catch (error) {
      console.error("Error creating CloudFront distribution:", error);
      throw error;
    }
  }

  /**
   * Requests an SSL certificate for the domain
   */
  private static async requestCertificate(domainName: string) {
    try {
      const command = new RequestCertificateCommand({
        DomainName: domainName,
        ValidationMethod: "DNS",
        SubjectAlternativeNames: [`www.${domainName}`],
      });

      const response = await acmClient.send(command);
      return response.CertificateArn;
    } catch (error) {
      console.error("Error requesting SSL certificate:", error);
      throw error;
    }
  }

  /**
   * Gets the status of a CloudFront distribution
   */
  static async getDistributionStatus(distributionId: string) {
    try {
      const command = new GetDistributionCommand({
        Id: distributionId,
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution?.Status;
    } catch (error) {
      console.error("Error getting distribution status:", error);
      throw error;
    }
  }

  /**
   * Updates a CloudFront distribution
   */
  static async updateDistribution(distributionId: string, config: any) {
    try {
      const command = new UpdateDistributionCommand({
        Id: distributionId,
        DistributionConfig: config,
        IfMatch: "", // You'll need to get this from the current distribution
      });

      const response = await cloudfrontClient.send(command);
      return response.Distribution;
    } catch (error) {
      console.error("Error updating distribution:", error);
      throw error;
    }
  }

  private static async setupOriginAccessIdentity(
    domainName: string,
    userId: string
  ) {
    try {
      // Create OAI
      const oaiCommand = new CreateCloudFrontOriginAccessIdentityCommand({
        CloudFrontOriginAccessIdentityConfig: {
          CallerReference: `${userId}-${Date.now()}-oai`,
          Comment: `OAI for ${domainName}`,
        },
      });
      const oaiResponse = await cloudfrontClient.send(oaiCommand);
      const oaiId = oaiResponse.CloudFrontOriginAccessIdentity?.Id;
      const oaiArn =
        oaiResponse.CloudFrontOriginAccessIdentity?.S3CanonicalUserId;

      if (!oaiId || !oaiArn) {
        throw new Error("Failed to create Origin Access Identity");
      }

      // Update S3 bucket policy
      const bucketPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCloudFrontAccess",
            Effect: "Allow",
            Principal: {
              CanonicalUser: oaiArn,
            },
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${process.env.S3_BUCKET_NAME}/*`,
          },
        ],
      };

      const policyCommand = new PutBucketPolicyCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Policy: JSON.stringify(bucketPolicy),
      });

      await s3Client.send(policyCommand);

      return oaiId;
    } catch (error) {
      console.error("Error setting up Origin Access Identity:", error);
      throw error;
    }
  }
}
