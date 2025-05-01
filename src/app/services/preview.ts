import puppeteer from "puppeteer";
import { S3Service } from "./s3";

export class PreviewService {
  private s3Service: S3Service;

  constructor(s3Service: S3Service) {
    this.s3Service = s3Service;
  }

  async generatePreview(htmlContent: string, siteId: string): Promise<string> {
    console.log('PreviewService: Starting preview generation for', { siteId });
    console.log('PreviewService: HTML content length', { length: htmlContent.length });

    try {
      console.log('PreviewService: Launching puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      console.log('PreviewService: Puppeteer launched successfully');

      try {
        console.log('PreviewService: Creating new page');
        const page = await browser.newPage();
        console.log('PreviewService: Page created');

        console.log('PreviewService: Setting viewport');
        // Set viewport to common desktop size
        await page.setViewport({
          width: 1280,
          height: 800,
          deviceScaleFactor: 1,
        });

        console.log('PreviewService: Setting HTML content');
        // Load the HTML content
        await page.setContent(htmlContent, {
          waitUntil: ["networkidle0", "domcontentloaded"],
        });

        console.log('PreviewService: Waiting for fonts to load');
        // Wait for any fonts to load
        await page.evaluateHandle("document.fonts.ready");

        console.log('PreviewService: Waiting for animations');
        // Wait for any animations to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('PreviewService: Taking screenshot');
        // Take the screenshot
        const screenshot = await page.screenshot({
          type: "png",
          fullPage: true,
        });
        console.log('PreviewService: Screenshot taken, size:', { bytes: screenshot.length });

        console.log('PreviewService: Uploading to S3');
        // Upload to S3
        const previewUrl = await this.s3Service.uploadPreview(
          siteId,
          Buffer.from(screenshot)
        );
        console.log('PreviewService: Upload successful, URL:', { previewUrl });
        return previewUrl;
      } catch (error) {
        console.error('PreviewService: Error during preview generation:', error);
        console.error('PreviewService: Error details:', JSON.stringify(error, null, 2));
        console.error('PreviewService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      } finally {
        console.log('PreviewService: Closing browser');
        await browser.close();
        console.log('PreviewService: Browser closed');
      }
    } catch (error) {
      console.error('PreviewService: Error launching puppeteer:', error);
      console.error('PreviewService: Error details:', JSON.stringify(error, null, 2));
      console.error('PreviewService: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
}