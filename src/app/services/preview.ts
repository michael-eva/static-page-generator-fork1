import puppeteer from "puppeteer";
import { S3Service } from "./s3";

export class PreviewService {
  private s3Service: S3Service;

  constructor(s3Service: S3Service) {
    this.s3Service = s3Service;
  }

  async generatePreview(htmlContent: string, siteId: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to common desktop size
      await page.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Load the HTML content
      await page.setContent(htmlContent, {
        waitUntil: ["networkidle0", "domcontentloaded"],
      });

      // Wait for any fonts to load
      await page.evaluateHandle("document.fonts.ready");

      // Wait for any animations to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Take the screenshot
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true,
      });

      // Upload to S3
      const previewUrl = await this.s3Service.uploadPreview(
        siteId,
        Buffer.from(screenshot)
      );
      return previewUrl;
    } finally {
      await browser.close();
    }
  }
}
