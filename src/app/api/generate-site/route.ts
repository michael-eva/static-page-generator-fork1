import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Service } from "../../services/s3";
import { LandingPageGenerator, BusinessInfo } from "../../services/generator";
import { checkRateLimit } from "../../core/security";
import { supabase } from "@/lib/supabase";
import { PreviewService } from "@/app/services/preview";
import { fetchTemplate } from "@/app/services/utils";

const BusinessInfoSchema = z.object({
  userId: z.string(),
  name: z.string(),
  htmlSrc: z.string(),
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
    logo_metadata: z
      .object({
        width: z.number(),
        height: z.number(),
        aspectRatio: z.number(),
      })
      .optional(),
    tagline: z.string().optional(),
  }),
}) satisfies z.ZodType<BusinessInfo>;

const s3 = new S3Service();
const generator = new LandingPageGenerator();
const previewService = new PreviewService(s3);

export async function POST(request: Request) {
  let siteId: string | undefined;
  try {
    // Check rate limit and API key
    await checkRateLimit(request);

    const body = await request.json();
    const validatedData = BusinessInfoSchema.parse(body);
    const { userId } = validatedData;
    const html = await fetchTemplate(validatedData.htmlSrc);
    // console.log("htmlContent", htmlContent);
    // Generate site ID
    siteId = `${validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

    // Pass siteId to generator
    const htmlContent = await generator.generate({
      ...validatedData,
      htmlContent: html,
      images: validatedData.images.map((img) => ({
        url: img.url,
        description: img.description,
        metadata: img.metadata,
      })),
    });
    console.log(siteId, validatedData.htmlSrc);

    // Deploy to S3
    const [deployment, previewUrl] = await Promise.all([
      s3.deploy(siteId, htmlContent, validatedData.htmlSrc),
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
