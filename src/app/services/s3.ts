import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export class S3Service {
  private s3: S3Client;
  public bucketName: string;
  public region: string;
  public websiteEndpoint: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.websiteEndpoint = `http://${this.bucketName}.s3-website.${this.region}.amazonaws.com`;
    
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }

  async deploy(siteId: string, htmlContent: string) {
    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${siteId}/index.html`,
        Body: htmlContent,
        ContentType: 'text/html'
      }));

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${siteId}/index.html`;
      return { url, siteId };
    } catch (error) {
      console.error("Deployment failed:", error);
      throw new Error("Deployment failed");
    }
  }

  async getDeploymentStatus(siteId: string): Promise<"completed" | "not_found"> {
    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: `${siteId}/index.html`
      }));
      return "completed";
    } catch {
      return "not_found";
    }
  }

  async deleteSite(siteId: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${siteId}/index.html`
      }));
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
  ): Promise<{ url: string; metadata: { width: number; height: number; aspectRatio: number } }> {
    const key = `${siteId}/assets/${type}s/${fileName}`;
    const metadata = await this.getImageMetadata(buffer);

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
        Metadata: {
          width: metadata.width.toString(),
          height: metadata.height.toString(),
          aspectRatio: metadata.aspectRatio.toString()
        }
      }));

      // Use the same URL format as the index.html
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, metadata };
    } catch (error) {
      console.error('S3 Upload Failed:', error);
      throw error;
    }
  }

  private async getImageMetadata(buffer: ArrayBuffer): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    // Use sharp to get image dimensions
    const sharp = (await import('sharp')).default;
    const image = sharp(Buffer.from(buffer));
    const { width, height } = await image.metadata();

    if (!width || !height) {
      throw new Error('Could not get image dimensions');
    }

    return {
      width,
      height,
      aspectRatio: width / height
    };
  }
} 