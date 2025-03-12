import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

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
      Create a modern, responsive HTML landing page for this business:
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
      3. Implement the specified contact method ({contactType}) with the following specifications:
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

      4. Use the specified color palette for styling
      
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
        <body>
            ... (page content) ...
            <script>
            </script>
        </body>
        </html>

        Return only the complete HTML code, no explanations.
    `);
  }

  async generate(businessInfo: BusinessInfo): Promise<string> {
    const messages = await this.template.formatMessages({
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
      colorPalette: businessInfo.design_preferences.color_palette || "default",
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
