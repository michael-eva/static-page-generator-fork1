import { NextResponse } from "next/server";
import { S3Service, DeploymentFile } from "../../services/s3";

import { checkRateLimit } from "../../core/security";
import { supabase } from "@/lib/supabase/server/supsbase";
import { PreviewService } from "@/app/services/preview";
import { BusinessInfoSchema } from "@/types/business";
import { checkUserProjectLimit } from "./helper";
import { LandingPageGenerator } from "@/app/services/claude-generator";

const s3 = new S3Service();
const generator = new LandingPageGenerator();
const previewService = new PreviewService(s3);

export async function POST(request: Request) {
  let siteId: string | undefined;
  try {
    // Check rate limit and API key
    await checkRateLimit(request);

    // const body = await request.json();
    // const validatedData = BusinessInfoSchema.parse(body);
    const validatedData = {
      userId: "56991853-21b1-469c-8dee-12f09f5d945f",
      name: "Alpine Landscape Design",
      description:
        "Premium landscape and garden design services for residential and commercial properties. We create stunning outdoor spaces that blend beauty with functionality.",
      offerings: [
        "Garden Design",
        "Hardscape Installation",
        "Water Features",
        "Outdoor Lighting",
        "Lawn Care",
      ],
      location: "1234 Mountain View Road, Boulder, CO 80302",
      images: [
        {
          url: "https://example.com/images/garden1.jpg",
          description: "Modern garden design with stone pathways",
          metadata: {
            width: 800,
            height: 600,
            aspectRatio: 1.33,
          },
        },
        {
          url: "https://example.com/images/water-feature.jpg",
          description: "Custom water feature for backyard patio",
          metadata: {
            width: 1200,
            height: 800,
            aspectRatio: 1.5,
          },
        },
        {
          url: "https://example.com/images/outdoor-lighting.jpg",
          description: "Night view of garden with professional lighting",
          metadata: {
            width: 900,
            height: 600,
            aspectRatio: 1.5,
          },
        },
      ],
      design_preferences: {
        style: "Modern and Natural",
        color_palette: {
          name: "Earth Tones",
          theme: "light",
          roles: {
            background: "#f8f5f2",
            surface: "#ffffff",
            text: "#2d3142",
            textSecondary: "#4f5d75",
            primary: "#3a7d44",
            accent: "#d58936",
          },
        },
      },
      contact_preferences: {
        type: "form",
        business_hours:
          "Monday-Friday: 8am-6pm, Saturday: 9am-3pm, Sunday: Closed",
        contact_email: "info@alpinelandscapedesign.com",
        contact_phone: "(303) 555-7890",
      },
      branding: {
        logo_url: "https://example.com/images/alpine-logo.png",
        logo_metadata: {
          width: 240,
          height: 80,
          aspectRatio: 3,
        },
        tagline: "Transforming Outdoor Spaces into Natural Paradises",
      },
    };
    const { userId } = validatedData;
    console.log("validatedData", validatedData);
    // Check project limit before proceeding
    const canCreateProject = await checkUserProjectLimit(userId);
    if (!canCreateProject) {
      return NextResponse.json(
        { error: "Project limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // we need to fetch all the css as js files from the template too
    siteId = `${validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

    // #2: Generate HTML files
    const files = await generator.generate({
      ...validatedData,
      images: validatedData.images.map((img) => ({
        url: img.url,
        description: img.description,
        metadata: img.metadata,
      })),
    });

    // Combine HTML files and assets for deployment
    const allFiles: DeploymentFile[] = [
      ...files.map((f) => ({
        name: f.name,
        content: f.content,
        contentType: "text/html",
      })),
    ];

    // Deploy to S3
    const [deployment, previewUrl] = await Promise.all([
      s3.deploy(siteId, allFiles),
      previewService.generatePreview(
        files.find((f) => f.name === "index.html")?.content || "",
        siteId
      ),
    ]);

    // Save to Supabase
    const { error } = await supabase.from("websites").insert({
      site_id: siteId,
      user_id: userId,
      domain_connected: false,
      name: validatedData.name,
      preview_url: previewUrl,
      project_url: deployment.url,
      hosting_status: "deployed",
    });

    if (error) {
      console.error("Error saving to Supabase:", error);
    }

    return NextResponse.json({
      site_id: siteId,
      status: "completed",
      // preview_url: deployment.url,
      dns_configuration: {
        type: "CNAME",
        name: siteId,
        value: `${s3.bucketName}.s3.${s3.region}.amazonaws.com`,
      },
    });
  } catch (error) {
    console.error("Error generating site:", error);

    // Update Supabase record with failed status if we have a siteId
    if (typeof siteId === "string") {
      const { error: updateError } = await supabase
        .from("websites")
        .update({ hosting_status: "failed" })
        .eq("site_id", siteId);

      if (updateError) {
        console.error("Error updating hosting status:", updateError);
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate site",
      },
      { status: 500 }
    );
  }
}
