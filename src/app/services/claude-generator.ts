import Anthropic from "@anthropic-ai/sdk";
import { setTimeout } from "timers/promises";

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

export class LandingPageGenerator {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      // Add custom timeout settings
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          // Increase timeout to 120 seconds
          signal: AbortSignal.timeout(120000),
        });
      },
    });
  }
  /**
   * Extracts HTML content from Claude's response,
   * regardless of how it's formatted
   */
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

    // Look for HTML in code blocks (with various markdown code block formats)
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

    // Check for HTML fragments without proper DOCTYPE
    const htmlFragmentPattern = /<html[^>]*>[\s\S]*?<\/html>/i;
    const fragmentMatch = responseText.match(htmlFragmentPattern);

    if (fragmentMatch) {
      return "<!DOCTYPE html>" + fragmentMatch[0];
    }

    // Try looking for body content if no complete HTML was found
    const bodyPattern = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const bodyMatch = responseText.match(bodyPattern);

    if (bodyMatch) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Landing Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 80%;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
${bodyMatch[0]}
</html>`;
    }
    // Try to extract content from a JSON response
    try {
      // First look for content fields with HTML
      const contentHtmlPattern =
        /"content"\s*:\s*"([^"]*<!DOCTYPE html>[\s\S]*?<\/html>[^"]*)"/i;
      const contentMatch = responseText.match(contentHtmlPattern);

      if (contentMatch && contentMatch[1]) {
        // Unescape the JSON string content
        return contentMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\r/g, "")
          .replace(/\\\\/g, "\\");
      }

      // Try to find JSON structure and parse it
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const possibleJson = responseText.substring(jsonStart, jsonEnd + 1);

          // Try to parse the JSON
          const parsed = JSON.parse(possibleJson);

          // Check various structures where HTML might be
          if (parsed.files && Array.isArray(parsed.files)) {
            const htmlFile = parsed.files.find(
              (file) =>
                file.name === "index.html" ||
                file.name?.endsWith(".html") ||
                (file.content &&
                  typeof file.content === "string" &&
                  file.content.includes("<!DOCTYPE html>"))
            );

            if (htmlFile && htmlFile.content) {
              return htmlFile.content;
            }
          }

          // Check for content field directly
          if (
            parsed.content &&
            typeof parsed.content === "string" &&
            parsed.content.includes("<!DOCTYPE html>")
          ) {
            return parsed.content;
          }

          // Recursively search for any property containing HTML
          const findHtml = (obj: any): string | null => {
            if (!obj || typeof obj !== "object") return null;

            for (const key in obj) {
              if (
                typeof obj[key] === "string" &&
                obj[key].includes("<!DOCTYPE html>") &&
                obj[key].includes("</html>")
              ) {
                return obj[key];
              } else if (typeof obj[key] === "object") {
                const result = findHtml(obj[key]);
                if (result) return result;
              }
            }

            return null;
          };

          const htmlContent = findHtml(parsed);
          if (htmlContent) {
            return htmlContent;
          }
        } catch (error) {
          // JSON parsing failed, continue to other methods
          console.error(error);
        }
      }
    } catch (error) {
      // Error in JSON extraction, continue to other methods
      console.error(error);
    }
    // Look for just the doctype and html open tag, then find the html close tag
    const docTypeIndex = responseText.indexOf("<!DOCTYPE html>");
    if (docTypeIndex !== -1) {
      const htmlOpenIndex = responseText.indexOf("<html", docTypeIndex);
      if (htmlOpenIndex !== -1) {
        // Find the matching closing </html> tag
        const htmlEndIndex = responseText.indexOf("</html>", htmlOpenIndex);
        if (htmlEndIndex !== -1) {
          return responseText.substring(docTypeIndex, htmlEndIndex + 7); // 7 = "</html>".length
        }
      }
    }

    // Last resort: if we find a significant portion of HTML-like content, extract and fix it
    const htmlTags = [
      "<!DOCTYPE",
      "<html",
      "<head",
      "<body",
      "<div",
      "<section",
      "<nav",
    ];
    for (const tag of htmlTags) {
      const tagIndex = responseText.indexOf(tag);
      if (tagIndex !== -1) {
        // Try to find a closing HTML tag
        const closingIndex = responseText.indexOf("</html>", tagIndex);
        if (closingIndex !== -1) {
          // Extract what looks like HTML content
          const partialHtml = responseText.substring(
            tagIndex,
            closingIndex + 7
          );

          // Check if it has a DOCTYPE
          if (!partialHtml.includes("<!DOCTYPE")) {
            return `<!DOCTYPE html>\n${partialHtml}`;
          }
          return partialHtml;
        } else {
          // If no closing HTML tag, try to extract as much as possible
          // and create a valid HTML document
          let content = responseText.substring(tagIndex);

          // Add missing DOCTYPE if needed
          if (!content.includes("<!DOCTYPE")) {
            content = `<!DOCTYPE html>\n${content}`;
          }

          // Add missing html tags if needed
          if (!content.includes("<html")) {
            content = content.replace(
              "<!DOCTYPE html>",
              '<!DOCTYPE html>\n<html lang="en">'
            );
            content += "\n</html>";
          }

          // Add missing head and body tags if needed
          if (!content.includes("<head")) {
            content = content.replace(
              '<html lang="en">',
              '<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>Generated Page</title>\n</head>'
            );
          }

          if (!content.includes("<body")) {
            const headCloseIndex = content.indexOf("</head>");
            if (headCloseIndex !== -1) {
              content = content.replace("</head>", "</head>\n<body>");
              content = content.replace("</html>", "</body>\n</html>");
            }
          }

          return content;
        }
      }
    }

    // If all else fails, return an error HTML page
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Website Generation Failed</title>
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
    pre {
      background-color: #eee;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .retry-btn {
      background-color: #5cb85c;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 16px;
    }
    .retry-btn:hover {
      background-color: #4cae4c;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Website Generation Failed</h1>
    <p>We couldn't extract valid HTML content from the AI's response.</p>
    
    <h2>What happened?</h2>
    <p>The AI was unable to generate proper HTML content for your website.</p>
    
    <h2>How to fix it:</h2>
    <ul>
      <li>Try again with fewer requirements</li>
      <li>Simplify the design preferences</li>
      <li>Reduce the number of images or content sections</li>
    </ul>
    
    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
    `;
  }
  /**
   * Generates HTML for a contact form with name, email, subject, and message fields
   */
  private getContactFormHtml(toEmail: string): string {
    return `
<form id="contactForm" action="https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/" method="POST" class="contact-form">
  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div class="form-group">
    <label for="subject">Subject</label>
    <input type="text" id="subject" name="subject" required>
  </div>
  <div class="form-group">
    <label for="message">Message</label>
    <textarea id="message" name="message" rows="5" required></textarea>
  </div>
  <button type="submit" class="submit-btn">Send Message</button>
</form>
<div id="form-success" style="display: none; color: green; margin-top: 15px;">
  Thank you for your message! We'll get back to you soon.
</div>
<script>
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const formObject = Object.fromEntries(formData.entries());
  
  fetch('https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-To-Email': '${toEmail}'
    },
    body: JSON.stringify(formObject)
  })
  .then(response => {
    if (response.ok) {
      document.getElementById('contactForm').reset();
      document.getElementById('form-success').style.display = 'block';
      setTimeout(() => {
        document.getElementById('form-success').style.display = 'none';
      }, 5000);
    } else {
      throw new Error('Form submission failed');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('There was an error submitting the form. Please try again later.');
  });
});
</script>
`;
  }

  /**
   * Generates HTML for a subscribe form with name, email, and optional phone fields
   */
  private getSubscribeFormHtml(toEmail: string): string {
    return `
<form id="subscribeForm" action="https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/" method="POST" class="subscribe-form">
  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div class="form-group">
    <label for="phone">Phone (Optional)</label>
    <input type="tel" id="phone" name="phone">
  </div>
  <button type="submit" class="submit-btn">Subscribe Now</button>
</form>
<div id="form-success" style="display: none; color: green; margin-top: 15px;">
  Thank you for subscribing! We'll keep you updated.
</div>
<script>
document.getElementById('subscribeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const formObject = Object.fromEntries(formData.entries());
  
  fetch('https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-To-Email': '${toEmail}'
    },
    body: JSON.stringify(formObject)
  })
  .then(response => {
    if (response.ok) {
      document.getElementById('subscribeForm').reset();
      document.getElementById('form-success').style.display = 'block';
      setTimeout(() => {
        document.getElementById('form-success').style.display = 'none';
      }, 5000);
    } else {
      throw new Error('Form submission failed');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('There was an error with your subscription. Please try again later.');
  });
});
</script>
`;
  }

  /**
   * Generates SVG logo code when no logo is provided
   */
  private generateLogoSvgCode(
    businessName: string,
    primaryColor: string = "#007bff"
  ): string {
    // Create a simple text-based logo with first letter or initials
    const initials = businessName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2); // Get up to first 2 initials

    return `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
  <rect width="60" height="60" rx="10" fill="${primaryColor}" />
  <text x="30" y="38" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
  <text x="130" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${primaryColor}" text-anchor="middle">${businessName}</text>
</svg>
`;
  }
  async generate(
    businessInfo: BusinessInfo
  ): Promise<Array<{ name: string; content: string }>> {
    const maxRetries = 3;
    let attempt = 0;
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

    // Generate logo if not provided
    const logoInfo = businessInfo.branding.logo_url
      ? `Logo URL: ${businessInfo.branding.logo_url}`
      : `Generate an SVG logo with these initials: ${businessInfo.name
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .toUpperCase()
          .substring(0, 2)}`;

    // Determine contact form requirements based on preferences
    let contactFormRequirements = "";
    switch (businessInfo.contact_preferences.type) {
      case "form":
        contactFormRequirements =
          "Include a contact form with name, email, subject, and message fields. The form should POST to: https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/";
        break;
      case "subscribe":
        contactFormRequirements =
          "Include a subscribe form with name, email, and phone (optional) fields. The form should POST to: https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/";
        break;
      case "email":
        contactFormRequirements = `Include the email address (${businessInfo.contact_preferences.contact_email}) prominently for users to contact the business.`;
        break;
      case "phone":
        contactFormRequirements = `Include the phone number (${businessInfo.contact_preferences.contact_phone}) prominently for users to contact the business.`;
        break;
      default:
        contactFormRequirements = "Include basic contact information.";
    }

    try {
      // Log API configuration
      console.log("Anthropic API Configuration:", {
        apiKeyExists: !!this.anthropic.apiKey,
      });

      // Using a direct HTML prompt approach
      const systemPrompt = `You are an expert web developer who creates beautiful, modern website landing pages. Generate a complete, production-ready HTML landing page based on the business information provided. Your HTML must be valid, complete, and ready to use without modifications.

REQUIREMENTS:
- Create a complete HTML file with all CSS in the head section
- The page must be responsive (mobile, tablet, desktop)
- Use modern CSS (Flexbox/Grid) for layout
- Include a styled navigation menu with proper mobile support
- Add hover effects, animations and transitions for interactive elements
- Implement proper spacing and visual hierarchy
- Include a hero section, features/offerings section, about section, and contact section
- Make the design visually appealing with attention to typography and color
- ${
        !businessInfo.branding.logo_url
          ? "If no logo is provided, generate an SVG logo with the business initials"
          : ""
      }
- ${contactFormRequirements}

Your response should be ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>.
Do not include explanations, comments about your approach, or any text outside the HTML document.`;

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
${logoInfo}
Tagline: ${businessInfo.branding.tagline || ""}

Create a complete, production-ready landing page HTML file for this business. The page should be visually appealing with all styling included in the head section.

Only provide the complete HTML document as your response, nothing else before or after.`;

      const requestPayload = {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user" as const,
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      };
      while (attempt < maxRetries) {
        try {
          console.log(`Attempting API call (${attempt + 1}/${maxRetries})...`);
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

          // Extract HTML content regardless of format
          let htmlContent = this.extractHtmlContent(content);

          // Post-process the HTML based on contact preferences
          if (
            businessInfo.contact_preferences.type === "form" &&
            !htmlContent.includes(
              "https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/"
            )
          ) {
            // Find the contact section and inject our form
            const contactSectionPattern =
              /<section[^>]*id=["']?contact["']?[^>]*>|<div[^>]*id=["']?contact["']?[^>]*>|<section[^>]*class=["'][^"']*contact[^"']*["'][^>]*>/i;
            const match = htmlContent.match(contactSectionPattern);
            if (match) {
              const index = match.index || 0;
              const sectionStart = htmlContent.substring(index);
              const closingTag = sectionStart.match(/<\/section>|<\/div>/i);
              if (closingTag) {
                const formHtml = this.getContactFormHtml(
                  businessInfo.contact_preferences.contact_email
                );
                const insertIndex = index + sectionStart.indexOf(closingTag[0]);
                htmlContent =
                  htmlContent.substring(0, insertIndex) +
                  formHtml +
                  htmlContent.substring(insertIndex);
              }
            }
          } else if (
            businessInfo.contact_preferences.type === "subscribe" &&
            !htmlContent.includes(
              "https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/"
            )
          ) {
            // Find the subscribe section and inject our form
            const subscribeSectionPattern =
              /<section[^>]*id=["']?subscribe["']?[^>]*>|<div[^>]*id=["']?subscribe["']?[^>]*>|<section[^>]*class=["'][^"']*subscribe[^"']*["'][^>]*>|<div[^>]*class=["'][^"']*subscribe[^"']*["'][^>]*>/i;
            const contactSectionPattern =
              /<section[^>]*id=["']?contact["']?[^>]*>|<div[^>]*id=["']?contact["']?[^>]*>|<section[^>]*class=["'][^"']*contact[^"']*["'][^>]*>/i;

            const subscribeMatch = htmlContent.match(subscribeSectionPattern);
            const contactMatch =
              !subscribeMatch && htmlContent.match(contactSectionPattern);

            const match = subscribeMatch || contactMatch;
            if (match) {
              const index = match.index || 0;
              const sectionStart = htmlContent.substring(index);
              const closingTag = sectionStart.match(/<\/section>|<\/div>/i);
              if (closingTag) {
                const formHtml = this.getSubscribeFormHtml(
                  businessInfo.contact_preferences.contact_email
                );
                const insertIndex = index + sectionStart.indexOf(closingTag[0]);
                htmlContent =
                  htmlContent.substring(0, insertIndex) +
                  formHtml +
                  htmlContent.substring(insertIndex);
              }
            }
          }

          // Generate logo if not provided
          if (
            !businessInfo.branding.logo_url &&
            !htmlContent.includes("<svg")
          ) {
            const logoSvg = this.generateLogoSvgCode(
              businessInfo.name,
              colorPalette.primary || "#007bff"
            );

            // Try to find the logo container
            const logoPattern =
              /<div[^>]*class=["'][^"']*logo[^"']*["'][^>]*>|<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>/i;
            const logoMatch = htmlContent.match(logoPattern);

            if (logoMatch) {
              const index = logoMatch.index || 0;
              const elementEnd = htmlContent.indexOf(">", index) + 1;
              htmlContent =
                htmlContent.substring(0, elementEnd) +
                logoSvg +
                htmlContent.substring(elementEnd);
            } else {
              // Try to find the header/nav section if no specific logo container
              const headerPattern = /<header[^>]*>|<nav[^>]*>/i;
              const headerMatch = htmlContent.match(headerPattern);

              if (headerMatch) {
                const index = headerMatch.index || 0;
                const elementEnd = htmlContent.indexOf(">", index) + 1;
                const logoDiv = `<div class="logo">${logoSvg}</div>`;
                htmlContent =
                  htmlContent.substring(0, elementEnd) +
                  logoDiv +
                  htmlContent.substring(elementEnd);
              }
            }
          }
          // Return a single index.html file
          return [
            {
              name: "index.html",
              content: htmlContent,
            },
          ];
        } catch (apiError: any) {
          attempt++;

          // Check for timeout or connection errors
          const isConnectionError =
            apiError.cause?.code === "ETIMEDOUT" ||
            apiError.cause?.code === "ECONNREFUSED" ||
            apiError.cause?.code === "ECONNRESET" ||
            apiError.message?.includes("Connection error") ||
            apiError.message?.includes("timeout");

          if (isConnectionError && attempt < maxRetries) {
            console.log(
              `Connection error. Retrying (${attempt}/${maxRetries})...`
            );
            // Exponential backoff: 2^attempt * 1000ms (2s, 4s, 8s)
            const backoffTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${backoffTime}ms before retry...`);
            await setTimeout(backoffTime);
            continue;
          }

          // Log and throw error for other errors or final retry
          console.error("Anthropic API Error Details:", {
            status: apiError.status,
            statusText: apiError.statusText,
            errorType: apiError.error?.type,
            errorMessage: apiError.error?.message,
            requestId: apiError.request_id,
            cause: apiError.cause,
          });
          throw apiError;
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Detailed error in generate():", {
        name: err.name,
        message: err.message,
      });
      return [
        {
          name: "error.html",
          content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
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
    pre {
      background-color: #eee;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .retry-btn {
      background-color: #5cb85c;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 16px;
    }
    .retry-btn:hover {
      background-color: #4cae4c;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>Website Generation Failed</h1>
    <p>We encountered an error while generating your website: ${
      err.message || "Unknown error"
    }</p>
    
    <h2>What happened?</h2>
    <p>There was a problem connecting to the AI service or processing the response.</p>
    
    <h2>How to fix it:</h2>
    <ul>
      <li>Check your internet connection</li>
      <li>Verify your API key is correct</li>
      <li>Try again in a few minutes</li>
    </ul>
    
    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
          `,
        },
      ];
    }

    // This should never be reached, but TypeScript requires a return value
    return [];
  }
}
