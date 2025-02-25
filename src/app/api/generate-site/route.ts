import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Service } from "../../services/s3";
import { LandingPageGenerator } from "../../services/generator";
import { checkRateLimit } from "../../core/security";
import { supabase } from "@/lib/supabase";
import { PreviewService } from "@/app/services/preview";
// Input validation schema
const BusinessInfoSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  offerings: z.array(z.string()),
  location: z.string(),
  images: z.array(
    z.object({
      url: z.string(),
      description: z.string(),
      metadata: z.object({
        width: z.number(),
        height: z.number(),
        aspectRatio: z.number(),
      }),
    })
  ),
  design_preferences: z.object({
    style: z.string().optional(),
    color_palette: z.string().optional(),
  }),
  contact_preferences: z.object({
    type: z.enum(["form", "email", "phone", "subscribe", ""]),
    business_hours: z.string(),
    contact_email: z.string(),
    contact_phone: z.string(),
  }),
  branding: z.object({
    logo_url: z.string().optional(),
    tagline: z.string().optional(),
  }),
});

const s3 = new S3Service();
const generator = new LandingPageGenerator();
const previewService = new PreviewService(s3);

export async function POST(request: Request) {
  try {
    // Check rate limit and API key
    await checkRateLimit(request);

    const body = await request.json();
    const validatedData = BusinessInfoSchema.parse(body);
    const { userId } = validatedData;

    // Generate site ID
    const siteId = `${validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

    // Pass siteId to generator
    const htmlContent = await generator.generate({
      ...validatedData,
      images: validatedData.images.map((img) => ({
        url: img.url,
        description: img.description,
        metadata: img.metadata,
      })),
    });
    console.log("htmlContent", htmlContent);

    // Deploy to S3
    const [deployment, previewUrl] = await Promise.all([
      s3.deploy(siteId, htmlContent),
      previewService.generatePreview(htmlContent, siteId),
    ]);
    // Save to Supabase
    const { error } = await supabase.from("websites").insert({
      site_id: siteId,
      user_id: userId,
      domain_connected: false,
      name: validatedData.name,
      preview_url: previewUrl,
      project_url: deployment.url,
    });

    if (error) {
      console.error("Error saving to Supabase:", error);
    }

    return NextResponse.json({
      site_id: siteId,
      status: "completed",
      preview_url: deployment.url,
      dns_configuration: {
        type: "CNAME",
        name: siteId,
        value: `${s3.bucketName}.s3.${s3.region}.amazonaws.com`,
      },
    });
  } catch (error) {
    console.error("Error generating site:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate site",
      },
      { status: 500 }
    );
  }
}
