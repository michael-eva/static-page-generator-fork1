import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import {
  getParentDirectoryUrl,
  getDirectoryFileList,
  fetchDirectoryContents,
  determineContentType,
} from "./utils";

export type DeploymentFile = {
  name: string;
  content: string | Buffer;
  contentType?: string;
};

export class S3Service {
  private s3: S3Client;
  public bucketName: string;
  public region: string;
  public websiteEndpoint: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-2";
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.websiteEndpoint = `http://${this.bucketName}.s3-website.${this.region}.amazonaws.com`;

    if (!this.bucketName) {
      throw new Error("S3_BUCKET_NAME environment variable is required");
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      endpoint: `https://s3.${this.region}.amazonaws.com`,
      forcePathStyle: false,
    });
  }

  private async ensurePublicAccess() {
    // Set bucket policy
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: [
            `arn:aws:s3:::${this.bucketName}`,
            `arn:aws:s3:::${this.bucketName}/*`,
            `arn:aws:s3:::${this.bucketName}/*/*`,
            `arn:aws:s3:::${this.bucketName}/*/*/*`,
          ],
        },
      ],
    };

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedOrigins: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedHeaders: ["*"],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    try {
      await this.s3.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(bucketPolicy),
        })
      );

      await this.s3.send(
        new PutBucketCorsCommand({
          Bucket: this.bucketName,
          CORSConfiguration: corsConfiguration,
        })
      );
    } catch (error) {
      console.error("Error setting bucket policy or CORS:", error);
      throw error;
    }
  }

  async deploy(
    siteId: string,
    files: DeploymentFile[],
    templatePath: string
  ): Promise<{ url: string }> {
    await this.ensurePublicAccess();

    const uploadPromises = files.map((file) => {
      const key = `${siteId}/${file.name}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.content,
        ContentType: file.contentType || "text/html",
      });

      return this.s3.send(command);
    });

    await Promise.all(uploadPromises);

    return {
      url: `${this.websiteEndpoint}/${siteId}/index.html`,
    };
  }

  async getDeploymentStatus(
    siteId: string
  ): Promise<"completed" | "not_found"> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: `${siteId}/index.html`,
        })
      );
      return "completed";
    } catch {
      return "not_found";
    }
  }

  async deleteSite(siteId: string) {
    try {
      // First, list all objects with the siteId prefix
      const listResponse = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: `${siteId}/`,
        })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete all objects found
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: listResponse.Contents.map(({ Key }) => ({ Key })),
            },
          })
        );
      }
    } catch (error) {
      console.error("Failed to delete site:", error);
      throw new Error("Failed to delete site");
    }
  }

  async uploadAsset(
    buffer: ArrayBuffer,
    fileName: string,
    contentType: string,
    type: string,
    siteId: string
  ): Promise<{
    url: string;
    metadata: { width: number; height: number; aspectRatio: number };
  }> {
    const key = `${siteId}/assets/${type}s/${fileName}`;
    const metadata = await this.getImageMetadata(buffer);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: contentType,
          Metadata: {
            width: metadata.width.toString(),
            height: metadata.height.toString(),
            aspectRatio: metadata.aspectRatio.toString(),
          },
        })
      );

      // Use website endpoint format consistently
      const url = `${this.websiteEndpoint}/${key}`;
      return { url, metadata };
    } catch (error) {
      console.error("S3 Upload Failed:", error);
      throw error;
    }
  }

  async uploadPreview(siteId: string, buffer: Buffer): Promise<string> {
    try {
      const key = `${siteId}/preview.png`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: "image/png",
          Metadata: {
            "x-amz-meta-site-id": siteId,
            "x-amz-meta-type": "preview",
          },
        })
      );

      // Use website endpoint format consistently
      const url = `${this.websiteEndpoint}/${key}`;
      return url;
    } catch (error) {
      console.error("Preview upload failed:", error);
      throw new Error("Failed to upload preview image");
    }
  }

  async deletePreview(siteId: string) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: `${siteId}/preview.png`,
        })
      );
    } catch (error) {
      console.error("Failed to delete preview:", error);
      throw new Error("Failed to delete preview");
    }
  }

  private async getImageMetadata(buffer: ArrayBuffer): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    // Use sharp to get image dimensions
    const sharp = (await import("sharp")).default;
    const image = sharp(Buffer.from(buffer));
    const { width, height } = await image.metadata();

    if (!width || !height) {
      throw new Error("Could not get image dimensions");
    }

    return {
      width,
      height,
      aspectRatio: width / height,
    };
  }
}
