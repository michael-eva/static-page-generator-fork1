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
  htmlContent?: string;
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
  private analyzeTemplate: ChatPromptTemplate;
  private designTemplate: ChatPromptTemplate;
  private refineTemplate: ChatPromptTemplate;
  private polishTemplate: ChatPromptTemplate;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "o1",
      temperature: 1,
    });

    // Step 1: Analysis template with enhanced focus areas
    this.analyzeTemplate = ChatPromptTemplate.fromTemplate(`
      Analyze this HTML template and identify its key structural components, styling approach, and interactive elements.
      Create a detailed structured analysis of the template's components and design opportunities.
      
      Template HTML:
      {templateHtml}
      
      When analyzing the template, pay special attention to these design aspects:

      1. Visual Depth Opportunities:
         - Where shadows and elevation could be added
         - Areas for potential overlapping elements
         - Sections where layering would create depth

      2. Typography Structure:
         - Current heading hierarchy
         - Text areas needing emphasis variation
         - Opportunities for typographic contrast

      3. Interactive Element Potential:
         - Elements that should have hover states
         - Areas for micro-animations
         - Transition opportunities between sections

      4. Layout Enhancement Opportunities:
         - Areas to implement asymmetric layouts
         - Potential for overlapping components
         - Sections that could benefit from varied rhythm

      Analyze how each section could be transformed to create visual interest while maintaining a clean, Apple-inspired aesthetic.
      
      Return your analysis as a detailed JSON object with these keys: 
      "coreStructure": ["List of core structural elements"],
      "designElements": ["List of visual elements to enhance"],
      "interactiveComponents": ["List of interactive elements"],
      "currentStylingApproach": "Description of current styling",
      "visualDepthOpportunities": ["Areas where depth could be added"],
      "typographyOpportunities": ["Ways to enhance typography"],
      "interactiveOpportunities": ["Elements needing interactive states"],
      "layoutOpportunities": ["Opportunities for layout improvements"],
      "recommendedChanges": ["Prioritized list of enhancements to achieve modern design"]
    `);

    // Step 2: Design specification template with specific technical guidance
    this.designTemplate = ChatPromptTemplate.fromTemplate(`
      Based on the analysis of the template structure, transform it according to these specific design specifications.
      
      Template Analysis: {templateAnalysis}
      
      Template HTML: {templateHtml}
      
      Business Details:
      Business Name: {name}
      Description: {description}
      Offerings: {offerings}
      Location: {location}
      Images: {images}
      Color Palette: {colorPalette}
      Style Preferences: {style}
      
      Apply these specific design enhancements:

      1. Visual Depth Implementation:
         - Add subtle shadows to cards and elements (box-shadow: 0 10px 20px rgba(0,0,0,0.05))
         - Create layered elements with negative margins and z-index positioning
         - Use subtle background shifts (1-2% darker/lighter) to create visual planes
         - Implement card elevation on hover (transform: translateY(-4px))

      2. Typography Refinement:
         - Establish clear typographic hierarchy:
           - Headings: font-weight: 700-800; letter-spacing: -0.02em;
           - Subheadings: font-weight: 600; letter-spacing: -0.01em;
           - Body: font-weight: 400-500; line-height: 1.6;
         - Use size contrast (at least 1.5x difference between heading levels)
         - Implement varied weights for emphasis within text blocks

      3. Interactive Element Enhancement:
         - Add hover transitions to all interactive elements (transition: all 0.2s ease)
         - Implement subtle scale effects on buttons (transform: scale(1.02))
         - Create focus states with glows or outlines (box-shadow: 0 0 0 3px rgba(primary-color, 0.2))
         - Add loading/success animations for forms

      4. Modern Layout Techniques:
         - Implement at least one asymmetric section with off-grid elements
         - Create overlapping components between sections (negative margins)
         - Use varied spacing rhythm (alternating between tight and loose sections)
         - Implement strategic whitespace around key calls to action

      5. Visual Interest Elements:
         - Add subtle background patterns or textures where appropriate
         - Implement accent lines or shapes for visual rhythm
         - Use gradient overlays for images (linear-gradient(rgba(primary-color, 0.1), transparent))
         - Create decorative elements that align with the brand identity
      
      6. Content Enhancement:
         - Structure content in clear visual hierarchies
         - Highlight key statistics or selling points
         - Implement varied content block layouts (not just uniform cards)
         - Create visual distinction between content types

      7. Technical Requirements:
         - Use Tailwind CSS for styling
         - Implement responsive design (mobile-first)
         - Maintain accessibility standards
         - Optimize for performance
      
      Create a design inspired by these modern, clean websites:
      - Apple.com: Notice the generous whitespace, subtle shadows, and refined typography
      - Stripe.com: Note the overlapping elements and asymmetric layouts
      - Airbnb.com: Observe the card-based design with consistent styling
      
      Return only the complete HTML code, no explanations.
    `);

    // Step 3: Refinement template with specific visual polish techniques
    this.refineTemplate = ChatPromptTemplate.fromTemplate(`
      Refine the following website HTML to enhance its visual appeal and user experience.
      
      Current HTML:
      {currentHtml}
      
      Business Details:
      Business Name: {name}
      Color Palette: {colorPalette}
      
      Apply these specific visual refinements:

      1. Visual Polish:
         - Ensure consistent corner radius throughout (8px for cards, 4px for buttons)
         - Add subtle inner shadows to input fields (inset box-shadow)
         - Create hover state variations for all interactive elements
         - Implement focus rings for accessibility that align with design aesthetic
         - Add subtle texture to backgrounds (fine grain or noise pattern at 2-3% opacity)

      2. Component-Specific Enhancements:
         - Navigation: Add subtle hover underlines or indicators
         - Hero Section: Create overlapping elements with shadow separation
         - Service Cards: Implement consistent hover states with elevation change
         - Contact Form: Add animated focus states and submit button transitions
         - Call to Action: Create visual emphasis through contrast and animation

      3. Advanced Visual Techniques:
         - Implement subtle parallax or scroll effects where appropriate
         - Add micro-interactions on important elements (button hover states, form field focus)
         - Create visual connections between sections through consistent styling
         - Use directional cues to guide user attention (arrows, lines, gradients)

      4. Brand Expression:
         - Ensure consistent application of brand colors at appropriate proportions (60/30/10 rule)
         - Apply visual styling that reinforces brand personality
         - Create distinctive accent elements unique to this brand
         - Implement a cohesive visual language across all components
      
      5. Contact Integration:
         - If contact type is "form": Create a visually integrated contact form with fields for name, email, subject, and message
         - Style form elements with consistent border treatments, focus states, and button styles
         - Add proper form submission handling with success/error states
         - Send form data to: https://didv7clabiyxjx54b2jejyis4u0oidoa.lambda-url.us-east-2.on.aws/
         - Include proper headers: 'Content-Type': 'application/json', 'X-To-Email': '{toEmail}'
      
      Return only the complete refined HTML code, no explanations.
    `);

    // Step 4: Final polish template with detailed refinements
    this.polishTemplate = ChatPromptTemplate.fromTemplate(`
      Apply these final polish techniques to elevate the design to a professional, visually sophisticated level.
      
      Current HTML:
      {refinedHtml}
      
      Business Details:
      Business Name: {name}
      Color Palette: {colorPalette}
      
      1. Balanced Asymmetry:
         - Ensure asymmetric layouts maintain visual balance
         - Check that white space is intentional and purposeful
         - Verify visual weight distribution across the page

      2. Visual Consistency:
         - Standardize spacing between similar elements (using 8px grid system)
         - Ensure consistent treatment of interactive states
         - Apply uniform styling to similar components
         - Maintain consistent text alignment patterns

      3. Visual Hierarchy Enhancement:
         - Verify clear paths for eye movement through the design
         - Ensure primary CTAs have appropriate visual emphasis
         - Check that important content has proper visual weight

      4. Design Detail Review:
         - Refine all border treatments for consistency
         - Ensure shadow usage creates appropriate depth
         - Check color application for proper contrast and emphasis
         - Verify spacing rhythm throughout the design

      5. Mobile Experience Enhancement:
         - Ensure touch targets are properly sized (min 44px)
         - Verify mobile spacing is adjusted appropriately
         - Check that visual hierarchy translates to smaller screens
         - Ensure important actions remain easily accessible
         
      6. Apple-Inspired Refinements:
         - Add subtle rounded corners consistently throughout
         - Implement clean, minimal navigation with proper spacing
         - Use generous whitespace around key elements
         - Ensure typography has proper weight variations and spacing
         - Create subtle depth through layering without excessive shadows

         Final Step: Style Integration Verification

Verify that all styles in this HTML will be properly applied:
1. Check for any external CSS dependencies and ensure they're properly loaded
2. Convert critical Tailwind classes to inline styles where necessary
3. Ensure all custom styles are properly defined and scoped
4. Add fallback styles for critical visual elements
5. Test any interactive elements to ensure they function without dependencies
      
      Return only the complete polished HTML code, no explanations.
    `);
  }

  async generate(businessInfo: BusinessInfo): Promise<string> {
    const templateHtml = businessInfo.htmlContent || "";
    const selectedPalette =
      colorPalettes.find(
        (palette) =>
          palette.name.toLowerCase() ===
          (
            businessInfo.design_preferences.color_palette || "modern"
          ).toLowerCase()
      ) || colorPalettes.find((palette) => palette.name === "Modern");

    // Convert roles object to color string
    const colors = selectedPalette
      ? Object.entries(selectedPalette.roles)
          .map(([role, color]) => `${role}: ${color}`)
          .join(", ")
      : "";

    console.log("Starting enhanced multi-step generation process...");

    // Step 1: Analyze the template
    console.log(
      "Step 1: Analyzing template structure and design opportunities..."
    );
    const analysisMessages = await this.analyzeTemplate.formatMessages({
      templateHtml,
    });

    const analysisResponse = await this.llm.invoke(analysisMessages);
    const templateAnalysis = analysisResponse.content.toString();
    console.log(
      "Template analysis complete with enhanced design opportunities."
    );

    // Step 2: Generate initial design based on analysis
    console.log(
      "Step 2: Generating initial design with specific enhancements..."
    );
    const designMessages = await this.designTemplate.formatMessages({
      templateHtml,
      templateAnalysis,
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
    });

    const designResponse = await this.llm.invoke(designMessages);
    const initialHtml = designResponse.content.toString();
    console.log("Initial design generated with enhanced visual elements.");

    // Step 3: Refine the design with specific enhancements
    console.log(
      "Step 3: Refining design with visual polish and component enhancements..."
    );
    const refineMessages = await this.refineTemplate.formatMessages({
      currentHtml: initialHtml,
      name: businessInfo.name || "",
      colorPalette: colors,
      toEmail: businessInfo.contact_preferences.contact_email,
    });

    const refineResponse = await this.llm.invoke(refineMessages);
    const refinedHtml = refineResponse.content.toString();
    console.log("Design refinement complete with advanced visual techniques.");

    // Step 4: Final polish for professional-level design
    console.log(
      "Step 4: Applying final polish for professional-level design..."
    );
    const polishMessages = await this.polishTemplate.formatMessages({
      refinedHtml,
      name: businessInfo.name || "",
      colorPalette: colors,
    });

    const polishResponse = await this.llm.invoke(polishMessages);
    const finalHtml = polishResponse.content.toString();
    console.log("Final polish complete - design ready for deployment.");

    return finalHtml;
  }
}
