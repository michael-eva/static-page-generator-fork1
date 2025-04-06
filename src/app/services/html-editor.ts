import Anthropic from "@anthropic-ai/sdk";
import { S3Service } from "./s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

const EditResponse = z.object({
  old_html: z.string(),
  new_html: z.string(),
  changes: z.array(z.object({
    old_content: z.string(),
    new_content: z.string(),
    description: z.string()
  }))
});

export class HTMLEditor {
  private anthropic: Anthropic;
  private s3: S3Service;
  private openai: OpenAI;

  constructor(apiKey?: string) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('HTMLEditor can only be used on the server side');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(120000),
        });
      },
    });
    this.s3 = new S3Service();
    this.openai = new OpenAI();
  }

  private extractHtmlContent(responseText: string): string {
    // Check if the response starts with <!DOCTYPE html> (with optional whitespace)
    if (/^\s*<!DOCTYPE html>/i.test(responseText)) {
      return responseText.trim();
    }

    // Try to find a complete HTML document
    const htmlPattern = /<!DOCTYPE html>[\s\S]*?<\/html>/i;
    const htmlMatch = responseText.match(htmlPattern);

    if (htmlMatch) {
      return htmlMatch[0];
    }

    // Look for HTML in code blocks
    const codeBlockPatterns = [
      /```html\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*```/i,
      /```\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*```/i,
      /`(<!DOCTYPE html>[\s\S]*?<\/html>)`/i,
    ];

    for (const pattern of codeBlockPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If all else fails, return an error HTML page
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Edit Failed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .error-container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    h1 {
      color: #d9534f;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Edit Failed</h1>
    <p>We couldn't extract valid HTML content from the AI's response.</p>
  </div>
</body>
</html>
    `;
  }

  async editHTML(siteId: string, prompt: string): Promise<{ success: boolean; message: string; old_html?: string; new_html?: string; changes?: Array<{old_content: string, new_content: string, description: string}> }> {
    try {
      // Check if the site exists using the S3Service method
      const status = await this.s3.getDeploymentStatus(siteId);
      if (status === "not_found") {
        return {
          success: false,
          message: "The website content could not be found. Please make sure the site exists and try again.",
        };
      }

      // Get the current HTML content from S3 using the S3 client
      const command = new GetObjectCommand({
        Bucket: this.s3.bucketName,
        Key: `${siteId}/index.html`,
      });

      const response = await this.s3.getS3Client().send(command);
      if (!response.Body) {
        throw new Error("No content found in S3");
      }

      // Convert the stream to a string
      const currentHTML = await response.Body.transformToString();

      // Prepare the prompt for OpenAI
      const systemPrompt = `You are an expert web developer. Your task is to edit the provided HTML content based on the user's instructions. 
You must return a structured response containing both the old and new HTML, along with a description of the changes made.

CRITICAL REQUIREMENTS:
1. RETURN THE COMPLETE HTML DOCUMENT - do not omit any parts, including:
   - All DOCTYPE and meta tags
   - All CSS in <style> tags and external stylesheets
   - All JavaScript in <script> tags and external scripts
   - All HTML structure and content
   - All comments and formatting
2. PRESERVE THE ORIGINAL HTML STRUCTURE - only modify the specific parts that need to be changed
3. Keep all existing classes, IDs, and attributes
4. Maintain all existing functionality and event handlers
5. Only modify the specific elements or sections mentioned in the user's instructions
6. If the user's instructions are unclear, make minimal changes and preserve the original structure

The response must be in JSON format with the following structure:
{
  "old_html": "The original HTML content",
  "new_html": "The modified HTML content",
  "changes": [
    {
      "old_content": "The original content that was changed",
      "new_content": "The new content that replaced it",
      "description": "A brief description of what was changed"
    }
  ]
}

IMPORTANT: The new_html must be a complete, valid HTML document ready for deployment. Do not use ellipsis (...) or omit any content. Include everything from the original document, only modifying the specific parts mentioned in the instructions.`;

      const userPrompt = `Current HTML content:
${currentHTML}

User's edit instructions:
${prompt}

Please provide the complete edited HTML document that implements these changes. Remember to preserve ALL original content and only modify the specific parts mentioned in the instructions. The response must be a complete HTML document ready for deployment.`;

      const completion = await this.openai.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: zodResponseFormat(EditResponse, "json"),
        max_tokens: 16384,
        temperature: 0.7,
      });

      const result = completion.choices[0].message.parsed;

      if (!result) {
        throw new Error("Failed to parse OpenAI response");
      }

      return {
        success: true,
        message: "Preview changes generated successfully. Please review before deploying.",
        old_html: result.old_html,
        new_html: result.new_html,
        changes: result.changes
      };
    } catch (error) {
      console.error("Error editing HTML:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to edit HTML",
      };
    }
  }

  async deployChanges(siteId: string, newHtml: string): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const deployment = await this.s3.deploy(siteId, [
        {
          name: "index.html",
          content: newHtml,
          contentType: "text/html",
        },
      ]);

      return {
        success: true,
        message: `HTML successfully deployed. The updated site is available at: ${deployment.url}`,
        url: deployment.url
      };
    } catch (error) {
      console.error("Error deploying changes:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to deploy changes",
      };
    }
  }
} 