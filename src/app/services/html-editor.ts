import Anthropic from "@anthropic-ai/sdk";
import { S3Service } from "./s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import Groq from "groq-sdk";

export class HTMLEditor {
  private anthropic: Anthropic;
  private s3: S3Service;
  private groq: InstanceType<typeof Groq>;

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
    this.groq = new Groq();
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

  async editHTML(siteId: string, prompt: string): Promise<{ success: boolean; message: string; old_html?: string; new_html?: string }> {
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

      // Prepare the prompt for Groq
      const systemPrompt = `You are an expert web developer. Your task is to edit the provided HTML content based on the user's instructions. 

CRITICAL REQUIREMENTS:
1. RETURN THE COMPLETE, UNCHANGED HTML DOCUMENT - only modify the specific parts mentioned in the instructions
   - Keep ALL original code, including:
     * All DOCTYPE and meta tags
     * All CSS in <style> tags and external stylesheets
     * All JavaScript in <script> tags and external scripts
     * All HTML structure and content
     * All comments and formatting
     * All classes, IDs, and attributes
     * All event handlers and functionality
2. ONLY modify the specific elements or sections mentioned in the user's instructions
3. If the user's instructions are unclear, make minimal changes and preserve the original structure

EXAMPLE:
If the original HTML has:
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
  <style>
    .header { color: blue; }
    .footer { color: red; }
  </style>
</head>
<body>
  <div class="header">Welcome</div>
  <div class="content">Hello World</div>
  <div class="footer">Copyright 2024</div>
</body>
</html>

And the instruction is to "change the header text to 'Welcome Back'", you should return:
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
  <style>
    .header { color: blue; }
    .footer { color: red; }
  </style>
</head>
<body>
  <div class="header">Welcome Back</div>
  <div class="content">Hello World</div>
  <div class="footer">Copyright 2024</div>
</body>
</html>

Notice how EVERYTHING else remains exactly the same, only the requested change is made.

IMPORTANT: Your response must be ONLY the complete HTML document, starting with <!DOCTYPE html> and ending with </html>.
DO NOT include any explanations, comments, or additional text.
DO NOT use markdown formatting or code blocks.
The response must be a complete, valid HTML document ready for deployment, with ALL original code preserved except for the specific changes requested.`;

      const userPrompt = `Current HTML content:
${currentHTML}

User's edit instructions:
${prompt}

Please provide the complete edited HTML document that implements these changes. Remember to preserve ALL original content and only modify the specific parts mentioned in the instructions. The response must be a complete HTML document ready for deployment.`;

      let fullResponse = '';
      const chatCompletion = await this.groq.chat.completions.create({
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
        model: "qwen-2.5-coder-32b",
        temperature: 0.6,
        max_completion_tokens: 70000,
        top_p: 0.95,
        stream: true,
        stop: null
      });

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
      }

      // Extract the HTML content from the response
      const newHTML = this.extractHtmlContent(fullResponse);

      return {
        success: true,
        message: "Preview changes generated successfully. Please review before deploying.",
        old_html: currentHTML,
        new_html: newHTML
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