import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

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
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(
    businessInfo: BusinessInfo
  ): Promise<Array<{ name: string; content: string }>> {
    console.log("Starting landing page generation...");

    // Format business information for the prompt
    const formattedImages = businessInfo.images
      .map(
        (img) =>
          `${img.url} - ${img.description} (${img.metadata.width}x${img.metadata.height})`
      )
      .join("\n");

    console.log("Formatted business info:", {
      name: businessInfo.name,
      offerings: businessInfo.offerings,
      imageCount: businessInfo.images.length,
    });

    const formattedOfferings = businessInfo.offerings.join("\n");
    const colorPalette =
      businessInfo.design_preferences.color_palette?.roles || {};

    try {
      // Log API configuration
      console.log("Anthropic API Configuration:", {
        apiKeyExists: !!this.anthropic.apiKey,
        apiKeyLength: this.anthropic.apiKey ? this.anthropic.apiKey.length : 0,
      });

      // Log request payload
      const systemPrompt = `You are an expert web developer specializing in creating visually stunning, modern websites. Your task is to generate a complete, production-ready landing page with beautiful styling. The page must look professional and polished without requiring any additional work.

CRITICAL REQUIREMENTS:
1. Create a COMPLETE HTML file with ALL necessary CSS in the head section
2. The CSS must be COMPREHENSIVE and DETAILED to ensure the page looks professional
3. The navigation menu MUST be properly styled (not just a bulleted list)
4. Create a responsive layout that works on all devices
5. Include proper spacing, padding, margins, and visual hierarchy
6. Implement modern design trends with attention to typography and visual appeal
7. Use Flexbox or CSS Grid for layout (avoid floats)
8. Include animations and transitions for interactive elements
9. Include media queries for mobile, tablet, and desktop
10. Ensure buttons, forms, and interactive elements have hover/active states
11. Add box-shadows, borders, and other styling details that make the site look professional
12. Use proper CSS class naming conventions (like BEM)
13. Ensure the complete functionality of all interactive elements with JavaScript

TECHNICAL SPECIFICATIONS:
- The navigation must have proper styling with hover effects and mobile responsive design
- Each section must have appropriate padding, margins, and visual separation
- Use a modern, visually appealing design with proper typography hierarchy
- Include a beautiful hero section with a gradient or image background
- Use CSS variables for color themes
- Ensure form elements are properly styled
- Include complete and detailed CSS for ALL elements on the page
- Make sure all buttons have proper styling, hover effects, and transitions
- Use Font Awesome or other icon libraries for visual elements
- Include specific CSS for mobile navigation (hamburger menu)

Your response must be well-structured JSON conforming to this schema:
{
  "files": [
    {
      "name": "index.html",
      "content": "<!DOCTYPE html>..."
    }
  ]
}

Do not cut corners on the CSS - the page must look complete and professional without any additional styling needed.`;

      const userPrompt = `Business Information:
Name: ${businessInfo.name}
Description: ${businessInfo.description}
Offerings: ${formattedOfferings}
Location: ${businessInfo.location}
Images: ${formattedImages}
Design Style: ${
        businessInfo.design_preferences.style || "Modern and professional"
      }
Color Palette: 
- Background: ${colorPalette.background || "#ffffff"}
- Surface: ${colorPalette.surface || "#f8f9fa"}
- Text: ${colorPalette.text || "#212529"}
- Text Secondary: ${colorPalette.textSecondary || "#6c757d"}
- Primary: ${colorPalette.primary || "#007bff"}
- Accent: ${colorPalette.accent || "#17a2b8"}
Contact Type: ${businessInfo.contact_preferences.type}
Business Hours: ${businessInfo.contact_preferences.business_hours}
Contact Email: ${businessInfo.contact_preferences.contact_email}
Contact Phone: ${businessInfo.contact_preferences.contact_phone}
Logo URL: ${businessInfo.branding.logo_url || "No logo provided"}
Tagline: ${businessInfo.branding.tagline || ""}

Please generate a visually stunning, complete landing page that looks professionally designed. The page should have beautiful styling, proper navigation, and a modern look and feel. Make sure the CSS is comprehensive and the page requires no additional styling work.

I specifically need:
1. A properly styled navigation menu (not just a plain list)
2. Beautiful section layouts with proper spacing
3. Responsive design for all devices
4. Modern, attractive styling for all elements
5. Complete CSS with proper hover states and transitions
6. A fully functional hamburger menu for mobile`;

      const requestPayload = {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user" as const,
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      };

      console.log(
        "Request payload structure:",
        JSON.stringify(requestPayload, null, 2)
      );

      try {
        const response = await this.anthropic.messages.create(requestPayload);
        console.log("API call successful:", {
          responseType: response.content[0].type,
          contentLength:
            response.content[0].type === "text"
              ? response.content[0].text.length
              : 0,
        });

        // Parse the response content
        const content =
          response.content[0].type === "text" ? response.content[0].text : "";

        console.log("Response content length:", content.length);

        let parsedContent;

        try {
          parsedContent = JSON.parse(content);
          // Validate with Zod schema
          const validatedFiles = GeneratedFiles.parse(parsedContent);
          return validatedFiles.files;
        } catch (parseError) {
          console.error(
            "Failed to parse Claude's response as JSON:",
            parseError
          );

          // Attempt to extract JSON from the response if it's wrapped in text
          const jsonMatch =
            content.match(/```json\n([\s\S]*?)\n```/) ||
            content.match(/{[\s\S]*}/);

          if (jsonMatch) {
            try {
              const extractedJson = jsonMatch[0].replace(/```json\n|```/g, "");
              parsedContent = JSON.parse(extractedJson);
              const validatedFiles = GeneratedFiles.parse(parsedContent);
              return validatedFiles.files;
            } catch (extractError) {
              console.error(
                "Failed to extract JSON from response:",
                extractError
              );
            }
          }

          // If all parsing attempts fail, return an error
          return [
            {
              name: "error.txt",
              content: "Failed to parse Claude's response. Please try again.",
            },
          ];
        }
      } catch (apiError: any) {
        console.error("Anthropic API Error Details:", {
          status: apiError.status,
          statusText: apiError.statusText,
          errorType: apiError.error?.type,
          errorMessage: apiError.error?.message,
          requestId: apiError.request_id,
          fullError: JSON.stringify(apiError, null, 2),
        });
        throw apiError;
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Detailed error in generate():", {
        name: err.name,
        message: err.message,
        type: (err as any).type,
        status: (err as any).status,
        requestId: (err as any).request_id,
        fullError: JSON.stringify(err, null, 2),
      });
      return [
        {
          name: "error.txt",
          content: `Failed to generate landing page: ${err.message || err}`,
        },
      ];
    }
  }
}
