import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import fs from "fs";
import path from "path";

export type ImageWithMetadata = {
  url: string;
  description: string;
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
};

export type BusinessInfo = {
  userId: string;
  name: string;
  htmlSrc: string;
  htmlContent?: string;
  description: string;
  offerings: string[];
  location: string;
  images: ImageWithMetadata[];
  design_preferences: {
    style?: string;
    color_palette?: {
      name: string;
      theme: string;
      roles: {
        background?: string;
        surface?: string;
        text?: string;
        textSecondary?: string;
        primary?: string;
        accent?: string;
      };
    };
  };
  contact_preferences: {
    type: "form" | "email" | "phone" | "subscribe" | "";
    business_hours: string;
    contact_email: string;
    contact_phone: string;
  };
  branding: {
    logo_url?: string;
    logo_metadata?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    tagline?: string;
  };
};

const GeneratedFile = z.object({
  name: z.string(),
  content: z.string(),
});

const GeneratedFiles = z.object({
  files: z.array(GeneratedFile),
});

export class LandingPageGenerator {
  private openai: OpenAI;
  private llm: ChatOpenAI;

  constructor() {
    this.openai = new OpenAI();
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 1,
    });
  }

  private getTemplateNameFromUrl(url: string): string {
    try {
      // Handle both URL and path formats
      const parts = url.includes("://")
        ? new URL(url).pathname.split("/")
        : url.split("/");

      // Find the index of 'templates-new' and get the next part
      const templateNewIndex = parts.findIndex(
        (part) => part === "templates-new"
      );
      if (templateNewIndex !== -1 && parts[templateNewIndex + 1]) {
        return parts[templateNewIndex + 1];
      }
      throw new Error("Invalid template URL format");
    } catch (error: any) {
      throw new Error(`Failed to parse template URL: ${error.message}`);
    }
  }

  private async readHtmlFiles(
    templatePath: string
  ): Promise<Array<{ name: string; content: string }>> {
    try {
      const files = fs.readdirSync(templatePath);
      const htmlFiles = files.filter((file) => file.endsWith(".html"));

      return htmlFiles.map((file) => ({
        name: file,
        content: fs.readFileSync(path.join(templatePath, file), "utf8"),
      }));
    } catch (error: any) {
      console.error(`Error reading HTML files from ${templatePath}:`, error);
      throw new Error(`Failed to read template files: ${error.message}`);
    }
  }

  async generate(
    businessInfo: BusinessInfo
  ): Promise<Array<{ name: string; content: string }>> {
    // Extract template name from URL and build path
    const templateName = this.getTemplateNameFromUrl(businessInfo.htmlSrc);
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates-new",
      templateName
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template directory not found: ${templatePath}`);
    }

    const templateFiles = await this.readHtmlFiles(templatePath);

    // Format business information for the prompt
    const formattedImages = businessInfo.images
      .map(
        (img) =>
          `${img.url} - ${img.description} (${img.metadata.width}x${img.metadata.height})`
      )
      .join("\n");

    const formattedOfferings = businessInfo.offerings.join("\n");

    // Generate customized files for each HTML template
    const generatedFiles: Array<{ name: string; content: string }> = [];

    for (const template of templateFiles) {
      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a web development expert. Your task is to customize the provided HTML template with the business information.

Make sure to:
- Replace all placeholder content with the business information
- Update text and content to match the business details
- Ensure all links and navigation are properly set up
- Maintain responsive design and accessibility
- Preserve the template's structure while customizing it for the business

Return an object with a 'files' array containing the customized HTML file.`,
          },
          {
            role: "user",
            content: `Template HTML (${template.name}):
${template.content}

Business Information:
Name: ${businessInfo.name}
Description: ${businessInfo.description}
Offerings: ${formattedOfferings}
Location: ${businessInfo.location}
Images: ${formattedImages}
Design Preferences: ${JSON.stringify(businessInfo.design_preferences)}
Contact Preferences: ${JSON.stringify(businessInfo.contact_preferences)}
Branding: ${JSON.stringify(businessInfo.branding)}`,
          },
        ],
        response_format: zodResponseFormat(GeneratedFiles, "json"),
      });

      const generatedFile = completion.choices[0].message.parsed?.files[0];
      if (generatedFile) {
        generatedFiles.push(generatedFile);
      }
    }

    return generatedFiles;
  }
}
