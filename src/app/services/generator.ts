import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import colorPalettes from "@/data/color-palettes.json";

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
  description: string;
  offerings: string[];
  location: string;
  images: ImageWithMetadata[];
  design_preferences: {
    style?: string;
    color_palette?: string;
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

export class LandingPageGenerator {
  private llm: ChatOpenAI;
  private template: ChatPromptTemplate;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "o1",
      temperature: 1,
    });

    this.template = ChatPromptTemplate.fromTemplate(`
      Modify this template HTML for the business:
      {templateHtml}
      
Business Details:
      Business Name: {name}
      Description: {description}
      Offerings: {offerings}
      Location: {location}
      Images: {images}
      Color Palette: {colorPalette}
      Style Preferences: {style}
      Contact Method: {contactType}
      Business Hours: {businessHours}
      Logo URL: {logoUrl}
      Tagline: {tagline}
      
      Requirements:
      1. Use modern HTML5 and Tailwind CSS
      2. Make it responsive and mobile-first
      3. Color Usage Guidelines:
         - Use 'background' color for the main page background
         - Use 'surface' color for cards, sections, and elevated elements
         - Use 'text' color for main body text and headings
         - Use 'textSecondary' for less emphasized text
         - Use 'primary' color for main CTAs and important buttons
         - Use 'secondary' for supporting elements
         - Use 'accent' sparingly for highlights or hover states
         - Use inline styles for colors

      4. Implement the specified contact method ({contactType}) with the following specifications:
         - If contact type is "form": Include a contact form with fields for name, email, subject, and message
         - If contact type is "subscribe": Include a subscription form with fields for name, email, and phone
         The form should have this structure:
         <form id="contactForm" class="...">
           <!-- form fields here -->
           <button type="submit" class="...">Submit</button>
         </form>
         
         Add the following script functionality (implemented as a proper script tag):
         - Prevent form default submission
         - Collect form data into an object
         - Send the form data to the following endpoint with proper CORS handling in script tags:
          - location: https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/
          - method: POST
          - headers: 
            - 'Content-Type': 'application/json'
            - 'X-To-Email': '{toEmail}'
            
          - body format:
            name: string
            email: string
            subject: string
            message: string
          
          - Add error and success handling:
            - On success: Show an alert with "Message sent successfully!"
            - On error: Show an alert with "Error sending message: " followed by the error message

      5. Use the specified color palette for styling
      6. Use the current year for the copyright / all rights reserved
      7. Favicon should be a logo image
      
      The HTML must start with proper DOCTYPE and include all necessary meta tags.
        Example structure:
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
            ... (rest of head content) ...
        </head>
        <body class="bg-[#color-from-background]">
            <nav class="bg-[#color-from-surface]">
                <h1 class="text-[#color-from-text]">...</h1>
            </nav>
            ... (page content) ...
        </body>
        </html>

        Return only the complete HTML code, no explanations.
    `);
  }
  private async fetchTemplate(iframeSrc: string): Promise<string> {
    try {
      // Create the full URL by combining the origin with the template path
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const templatePath = iframeSrc.startsWith("/")
        ? iframeSrc
        : `/${iframeSrc}`;
      const fullUrl = `${baseUrl}${templatePath}`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error fetching template:", error);
      throw error;
    }
  }

  async generate(businessInfo: BusinessInfo): Promise<string> {
    const templateHtml = await this.fetchTemplate(businessInfo.htmlSrc);
    const selectedPalette =
      colorPalettes.find(
        (palette) =>
          palette.name.toLowerCase() ===
          (
            businessInfo.design_preferences.color_palette || "modern"
          ).toLowerCase()
      ) || colorPalettes.find((palette) => palette.name === "Modern");

    // Modify the prompt template to emphasize preserving the template structure
    this.template = ChatPromptTemplate.fromTemplate(`
      Modify this existing HTML template while preserving its structure and styling:
      {templateHtml}
      
      Business Details:
       ... (rest of the business details) ... 
      
      Requirements:
      1. IMPORTANT: Preserve the template's existing structure, classes, and assets
      2. Keep all script and CSS references from the original template
      3. Only update the content, colors, and add new elements where needed
      4. Maintain the template's responsive design and styling
      5. Add the contact form functionality within the template's existing form section
      6. Use the provided color palette for styling updates
      7. Update text content with the business information
      8. Keep the template's original CSS classes and add Tailwind classes only when needed
      
      Return the complete modified HTML code, preserving all original template features.
    `);

    // Convert roles object to color string
    const colors = selectedPalette
      ? Object.entries(selectedPalette.roles)
          .map(([role, color]) => `${role}: ${color}`)
          .join(", ")
      : "";

    const messages = await this.template.formatMessages({
      templateHtml,
      name: businessInfo.name || "",
      description: businessInfo.description || "",
      offerings: businessInfo.offerings.join("\n"),
      location: businessInfo.location,
      images: businessInfo.images
        .filter((img) => img.url)
        .map(
          (img) =>
            `${img.url} - ${img.description} (${img.metadata.width}x${img.metadata.height}, aspect ratio: ${img.metadata.aspectRatio})`
        )
        .join("\n"),
      colorPalette: colors,
      style: businessInfo.design_preferences.style || "modern and professional",
      contactType: businessInfo.contact_preferences.type || "form",
      businessHours: businessInfo.contact_preferences.business_hours,
      logoUrl: businessInfo.branding.logo_url || "",
      tagline: businessInfo.branding.tagline || "",
      toEmail: businessInfo.contact_preferences.contact_email,
    });

    const response = await this.llm.invoke(messages);
    return response.content.toString();
  }
}
