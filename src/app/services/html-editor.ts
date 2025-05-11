import Anthropic from "@anthropic-ai/sdk";
import { S3Service } from "./s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";
import { JSDOM } from "jsdom";

type ModelProvider = "groq" | "cerebras";

// Define a schema for how changes will be described
const EditActionSchema = z.object({
  type: z.enum(["replaceText", "replaceHTML", "insertBefore", "insertAfter", "remove", "setAttribute", "addElement"]),
  selector: z.string(), // CSS selector to target the element
  content: z.string().optional(), // New content for replace or insert operations
  attribute: z.object({ // For setAttribute operations
    name: z.string(),
    value: z.string()
  }).optional(),
});

type EditAction = z.infer<typeof EditActionSchema>;

const ChangesetSchema = z.object({
  title: z.string(), // A title describing all the changes
  description: z.string(), // A detailed description of what changes are being made
  changes: z.array(EditActionSchema) // Array of specific changes to make
});

type Changeset = z.infer<typeof ChangesetSchema>;

export class HTMLEditor {
  private s3: S3Service;
  private groq: InstanceType<typeof Groq> | null = null;
  private hfClient: InstanceType<typeof InferenceClient> | null = null;
  private modelProvider: ModelProvider;
  private hfModel: string;

  constructor(
    modelProvider: ModelProvider = "cerebras",
    hfModel: string = "meta-llama/Llama-3.3-70B-Instruct" // Updated to correct format
  ) {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('HTMLEditor can only be used on the server side');
    }

    this.s3 = new S3Service();
    this.modelProvider = modelProvider;
    this.hfModel = hfModel;
    
    console.log(`HTMLEditor initialized with provider: ${modelProvider}, model: ${hfModel}`);

    if (modelProvider === "groq") {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error("GROQ_API_KEY environment variable is not set.");
      }
      this.groq = new Groq({ apiKey: groqApiKey });
      console.log("GROQ client initialized");
    } else if (modelProvider === "cerebras") {
      const hfToken = process.env.HF_TOKEN;
      if (!hfToken) {
        throw new Error("HF_TOKEN environment variable is not set.");
      }
      this.hfClient = new InferenceClient(hfToken);
      console.log(`Hugging Face Inference client initialized with token: ${hfToken.substring(0,4)}...`);
    } else {
      // Ensure exhaustive check - though TypeScript should catch this
      throw new Error(`Unsupported model provider: ${modelProvider}`);
    }
  }

  // Helper function to log large strings in chunks to avoid truncation
  private logFullContent(label: string, content: string) {
    console.log(`${label} - FULL CONTENT START (length: ${content.length})`);
    console.log("===============================================================");
    
    // Log in chunks of 1000 characters to avoid truncation
    const chunkSize = 1000;
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, i + chunkSize);
      console.log(`CHUNK ${i/chunkSize + 1}: ${chunk}`);
    }
    
    console.log("===============================================================");
    console.log(`${label} - FULL CONTENT END`);
  }

  private extractHtmlContent(responseText: string): string {
    if (!responseText || responseText.trim().length === 0) {
      console.error("Received empty response from AI model");
      return this.createErrorHtml("We received an empty response from the AI model. Please try again.");
    }
    
    console.log("Extracting HTML from response...");
    console.log(`Response length: ${responseText.length}`);
    console.log(`Response start: ${responseText.substring(0, 200)}...`);
    console.log(`Response end: ...${responseText.substring(responseText.length - 200)}`);
    
    // Log the full content for debugging
    this.logFullContent("RAW AI RESPONSE", responseText);
    
    // Check if the response starts with <!DOCTYPE html> (with optional whitespace)
    if (/^\s*<!DOCTYPE html>/i.test(responseText)) {
      console.log("Found complete HTML document starting with DOCTYPE");
      const result = responseText.trim();
      this.logFullContent("EXTRACTED COMPLETE HTML", result);
      return result;
    }

    // Try to find a complete HTML document
    const htmlPattern = /<!DOCTYPE html>[\s\S]*?<\/html>/i;
    const htmlMatch = responseText.match(htmlPattern);

    if (htmlMatch) {
      console.log("Found complete HTML document using pattern match");
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
        console.log("Extracted HTML from code block");
        return match[1];
      }
    }

    // Try a more lenient approach - look for partial HTML structure
    console.log("Trying more lenient HTML extraction...");
    
    // Check if we have html and body tags, even if doctype is missing
    if (responseText.includes("<html") && responseText.includes("<body") && responseText.includes("</html>")) {
      console.log("Found HTML with tags but missing DOCTYPE, adding DOCTYPE");
      // If we have html, body, and closing html tags but missing DOCTYPE, add it
      return `<!DOCTYPE html>${responseText.trim()}`;
    }
    
    // Last resort: Check if this is just the body content without surrounding structure
    if (responseText.includes("<") && responseText.includes(">") && !responseText.includes("<html") && !responseText.includes("<!DOCTYPE")) {
      console.log("Found content without HTML structure, wrapping in complete HTML document");
      // This might be just the body content, wrap it in a proper HTML structure
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
</head>
<body>
  ${responseText.trim()}
</body>
</html>`;
    }

    // If we get to this point, log more detailed information about the response
    console.log("HTML extraction failed - Detailed content analysis:");
    console.log(`Contains <!DOCTYPE html>: ${responseText.includes("<!DOCTYPE html")}`);
    console.log(`Contains <html: ${responseText.includes("<html")}`);
    console.log(`Contains <body: ${responseText.includes("<body")}`);
    console.log(`Contains </html>: ${responseText.includes("</html>")}`);
    console.log(`Contains \`\`\`: ${responseText.includes("```")}`);
    
    // Log what we received to help with debugging
    console.error("Failed to extract valid HTML from response. Response preview:", responseText.substring(0, 500));
    
    // Show the raw AI response in the error message
    return this.createErrorHtml(`We couldn't extract valid HTML content from the AI's response. Raw response: <pre style="overflow-x: auto; background: #eee; padding: 10px; margin-top: 10px; border: 1px solid #ddd;">${this.escapeHtml(responseText)}</pre>`);
  }
  
  private createErrorHtml(errorMessage: string): string {
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
    <p>${errorMessage}</p>
  </div>
</body>
</html>
    `;
  }

  // Helper function to escape HTML
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Try to extract a JSON changeset from the AI response
  private extractChangeset(responseText: string): Changeset | null {
    try {
      console.log("Attempting to extract changeset from response...");
      
      // Try to find JSON content in the response
      let jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        jsonMatch = responseText.match(/\{[\s\S]*"changes"\s*:\s*\[[\s\S]*\]\s*\}/);
      }
      
      if (!jsonMatch) {
        console.log("No JSON changeset found in response");
        console.log("Response was:");
        this.logFullContent("INVALID_RESPONSE", responseText);
        return null;
      }
      
      const jsonContent = jsonMatch[1] || jsonMatch[0];
      console.log("Found JSON content:", jsonContent.substring(0, 200) + "...");
      
      // Parse and validate the JSON against our schema
      const parsed = JSON.parse(jsonContent);
      const result = ChangesetSchema.safeParse(parsed);
      
      if (!result.success) {
        console.error("Changeset validation failed:", result.error);
        console.log("JSON content that failed validation:");
        this.logFullContent("INVALID_CHANGESET", jsonContent);
        return null;
      }
      
      console.log("Successfully extracted valid changeset");
      return result.data;
    } catch (error) {
      console.error("Error extracting changeset:", error);
      return null;
    }
  }
  
  // Apply a changeset to HTML
  private applyChangeset(html: string, changeset: Changeset): string {
    try {
      console.log(`Applying changeset: ${changeset.title}`);
      console.log(`Description: ${changeset.description}`);
      console.log(`Number of changes: ${changeset.changes.length}`);
      
      // Parse the HTML using JSDOM
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Apply each change in sequence
      changeset.changes.forEach((change, index) => {
        try {
          console.log(`Applying change ${index + 1}/${changeset.changes.length} - Type: ${change.type}, Selector: ${change.selector}`);
          
          // Find elements matching the selector
          const elements = document.querySelectorAll(change.selector);
          
          if (elements.length === 0) {
            console.warn(`No elements found for selector: ${change.selector}`);
            return; // Continue to next change
          }
          
          console.log(`Found ${elements.length} elements matching selector`);
          
          // Apply the change to each matched element
          elements.forEach(element => {
            switch (change.type) {
              case "replaceText":
                if (change.content !== undefined) {
                  element.textContent = change.content;
                }
                break;
                
              case "replaceHTML":
                if (change.content !== undefined) {
                  element.innerHTML = change.content;
                }
                break;
                
              case "insertBefore":
                if (change.content !== undefined) {
                  const temp = document.createElement('div');
                  temp.innerHTML = change.content;
                  const newNode = temp.firstChild;
                  if (newNode && element.parentNode) {
                    element.parentNode.insertBefore(newNode, element);
                  }
                }
                break;
                
              case "insertAfter":
                if (change.content !== undefined) {
                  const temp = document.createElement('div');
                  temp.innerHTML = change.content;
                  const newNode = temp.firstChild;
                  if (newNode && element.parentNode) {
                    if (element.nextSibling) {
                      element.parentNode.insertBefore(newNode, element.nextSibling);
                    } else {
                      element.parentNode.appendChild(newNode);
                    }
                  }
                }
                break;
                
              case "remove":
                if (element.parentNode) {
                  element.parentNode.removeChild(element);
                }
                break;
                
              case "setAttribute":
                if (change.attribute) {
                  element.setAttribute(change.attribute.name, change.attribute.value);
                }
                break;
                
              case "addElement":
                if (change.content !== undefined) {
                  const temp = document.createElement('div');
                  temp.innerHTML = change.content;
                  const newNode = temp.firstChild;
                  if (newNode) {
                    element.appendChild(newNode);
                  }
                }
                break;
            }
          });
          
          console.log(`Successfully applied change ${index + 1}`);
        } catch (error) {
          console.error(`Error applying change ${index + 1}:`, error);
        }
      });
      
      // Return the modified HTML
      const modifiedHtml = dom.serialize();
      console.log("Successfully applied all changes");
      return modifiedHtml;
    } catch (error) {
      console.error("Error applying changeset:", error);
      throw error;
    }
  }

  async editHTML(siteId: string, prompt: string): Promise<{ success: boolean; message: string; old_html?: string; new_html?: string; raw_response?: string; changes?: Changeset }> {
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
      
      // Save a backup of the original HTML before making any changes
      const originalHtml = currentHTML;
      
      // If the current HTML is empty, that's a problem
      if (!currentHTML || currentHTML.trim().length === 0) {
        console.error("Current HTML from S3 is empty");
        return {
          success: false,
          message: "The current website HTML is empty. Please contact support.",
        };
      }

      // Add logging for the current HTML before sending to the AI
      console.log(`Original HTML length: ${currentHTML.length}`);
      console.log(`Original HTML start: ${currentHTML.substring(0, 200)}...`);
      this.logFullContent("ORIGINAL HTML", currentHTML);

      // Prepare the prompt for the AI model - Using a targeted edit approach instead of full regeneration
      const systemPrompt = `You are an expert web developer. Your task is to create a targeted set of edits to modify an HTML document based on the user's instructions.

CRITICAL REQUIREMENTS:
1. DO NOT REGENERATE THE ENTIRE HTML. Instead, produce specific instructions to modify only the parts mentioned.
2. Return a JSON object describing the changes to make using CSS selectors.
3. Be very specific and precise with your selectors to target exactly the right elements.

Return your response in the following JSON format:
\`\`\`json
{
  "title": "Brief title describing the changes",
  "description": "Detailed description of what changes you're making and why",
  "changes": [
    {
      "type": "replaceText",
      "selector": "CSS selector to target the element",
      "content": "New text content"
    },
    {
      "type": "replaceHTML",
      "selector": "CSS selector",
      "content": "New HTML content"
    },
    {
      "type": "insertBefore",
      "selector": "CSS selector",
      "content": "HTML to insert before"
    },
    {
      "type": "insertAfter",
      "selector": "CSS selector",
      "content": "HTML to insert after"
    },
    {
      "type": "remove",
      "selector": "CSS selector for element to remove"
    },
    {
      "type": "setAttribute",
      "selector": "CSS selector",
      "attribute": {
        "name": "attribute name",
        "value": "attribute value"
      }
    },
    {
      "type": "addElement",
      "selector": "CSS selector for parent",
      "content": "HTML to add as child"
    }
  ]
}
\`\`\`

IMPORTANT NOTES:
1. Use ONLY the change types listed above
2. Be extremely specific with selectors to avoid unintended changes
3. Use classes, IDs, and other attributes to make selectors precise
4. When modifying text content, include the complete new text, not just what's changed
5. Don't try to modify the document structure (DOCTYPE, html, head, body tags)
6. Only include changes mentioned in the user's instructions

Do NOT include any explanations, comments, or additional text outside the JSON response.`;

      const userPromptContent = `Current HTML content:
${currentHTML}

User's edit instructions:
${prompt}

Please provide the necessary changes as a JSON object that will implement these edits.`;

      let fullResponse = '';

      if (this.modelProvider === "groq" && this.groq) {
        const chatCompletion = await this.groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptContent },
          ],
          model: "llama3-70b-8192", // Correct model name for Groq
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
      } else if (( this.modelProvider === "cerebras") && this.hfClient) {
        try {
          console.log(`Using Hugging Face Inference with provider: ${this.modelProvider}, model: ${this.hfModel}`);
          
          const chatCompletion = await this.hfClient.chatCompletion({
            // For cerebras provider, explicitly set it
            provider: this.modelProvider === "cerebras" ? "cerebras" : undefined,
            model: this.hfModel, // Use the stored model name
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPromptContent }
            ],
            max_tokens: 70000, // Adjust max tokens as needed for HF models
          });
          
          console.log("Hugging Face response received successfully");
          
          if (!chatCompletion || !chatCompletion.choices || !chatCompletion.choices[0] || !chatCompletion.choices[0].message) {
            console.error("Invalid response structure from Hugging Face:", JSON.stringify(chatCompletion).substring(0, 200));
            throw new Error("Invalid response from Hugging Face model");
          }
          
          fullResponse = chatCompletion.choices[0]?.message?.content ?? '';
          
          if (!fullResponse) {
            throw new Error("Empty content received from model");
          }
        } catch (error) {
          console.error("Error in Hugging Face inference:", error);
          throw error;
        }
      } else {
        throw new Error(`Invalid model provider configuration: ${this.modelProvider}`);
      }

      console.log("AI response received, length:", fullResponse.length);
      
      // Try to extract a changeset from the response
      const changeset = this.extractChangeset(fullResponse);
      
      if (!changeset) {
        // Instead of falling back, throw an error
        console.error("Failed to extract valid changeset from AI response");
        return {
          success: false,
          message: "The AI failed to produce a properly structured response. Please try a different prompt or contact support.",
          old_html: currentHTML,
          raw_response: fullResponse
        };
      }
      
      // Apply the changeset to the original HTML
      console.log("Applying changeset to original HTML");
      const newHTML = this.applyChangeset(currentHTML, changeset);
      
      // Log the new HTML
      console.log(`New HTML length: ${newHTML.length}`);
      console.log(`New HTML start: ${newHTML.substring(0, 200)}...`);
      this.logFullContent("NEW HTML AFTER APPLYING CHANGES", newHTML);
      
      // Safety check on the modified HTML
      if (!newHTML.includes("<html") || !newHTML.includes("<body") || !newHTML.includes("</html>")) {
        console.error("Generated HTML is missing essential elements after applying changes");
        return {
          success: false,
          message: "The changes couldn't be applied correctly. Please try a different prompt.",
          old_html: currentHTML,
          raw_response: fullResponse,
          changes: changeset
        };
      }
      
      return {
        success: true,
        message: "Preview changes generated successfully. Please review before deploying.",
        old_html: currentHTML,
        new_html: newHTML,
        raw_response: fullResponse,
        changes: changeset
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
      // Safety check - validation before deployment
      if (!newHtml || newHtml.trim().length < 100 || !newHtml.includes("<html") || !newHtml.includes("</html>")) {
        return {
          success: false,
          message: "Cannot deploy invalid HTML. The content appears to be incomplete or corrupted."
        };
      }
      
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