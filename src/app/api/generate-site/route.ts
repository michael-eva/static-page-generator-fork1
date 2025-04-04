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

    const body = await request.json();
    const validatedData = BusinessInfoSchema.parse(body);
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
