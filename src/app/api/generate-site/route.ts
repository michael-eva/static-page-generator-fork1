import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Service, DeploymentFile } from "../../services/s3";
import { LandingPageGenerator, BusinessInfo } from "../../services/generator";
import { checkRateLimit } from "../../core/security";
import { supabase } from "@/lib/supabase/server/supsbase";
import { PreviewService } from "@/app/services/preview";
import { fetchTemplate } from "@/app/services/utils";
import { fetchAssets } from "@/app/services/assetUtils";
import path from 'path';

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

async function checkUserProjectLimit(userId: string): Promise<boolean> {
  const { data: projectCount } = await supabase
    .from("websites")
    .select("id", { count: "exact" })
    .eq("user_id", userId);

  // You can store this in an env variable or user's subscription plan
  const PROJECT_LIMIT = Number(process.env.NEXT_PUBLIC_PROJECT_LIMIT);

  return (projectCount?.length || 0) < PROJECT_LIMIT;
}

export async function POST(request: Request) {
  let siteId: string | undefined;
  try {
    // Check rate limit and API key
    await checkRateLimit(request);

    const body = await request.json();
    const validatedData = BusinessInfoSchema.parse(body);
    const { userId } = validatedData;

    // Check project limit before proceeding
    const canCreateProject = await checkUserProjectLimit(userId);
    if (!canCreateProject) {
      return NextResponse.json(
        { error: "Project limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    const html = await fetchTemplate(validatedData.htmlSrc);
    
    siteId = `${validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

    // Generate HTML files
    const files = await generator.generate({
      ...validatedData,
      htmlContent: html,
      images: validatedData.images.map((img) => ({
        url: img.url,
        description: img.description,
        metadata: img.metadata,
      })),
    });

    // Fetch assets from template
    const templateName = validatedData.htmlSrc.split('/').find((part, index, array) => 
      array[index - 1] === 'templates-new'
    );
    if (!templateName) {
      throw new Error('Could not determine template name from htmlSrc');
    }
    const templatePath = path.join(process.cwd(), 'public/templates-new', templateName);
    console.log('Template path:', templatePath);
    console.log('Template name:', templateName);
    const assets = await fetchAssets(templatePath);
    console.log('Assets found:', assets.length);

    // Combine HTML files and assets for deployment
    const allFiles: DeploymentFile[] = [
      ...files.map(f => ({
        name: f.name,
        content: f.content,
        contentType: 'text/html'
      })),
      ...assets.map(asset => ({
        name: asset.name,
        content: asset.content,
        contentType: asset.contentType
      }))
    ];
    
    console.log('Total files to deploy:', allFiles.length);
    console.log('File names:', allFiles.map(f => f.name));

    // Deploy to S3
    const [deployment, previewUrl] = await Promise.all([
      s3.deploy(siteId, allFiles, validatedData.htmlSrc),
      previewService.generatePreview(files.find(f => f.name === 'index.html')?.content || '', siteId),
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
