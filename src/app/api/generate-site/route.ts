import { NextResponse } from "next/server";
import { S3Service, DeploymentFile } from "../../services/s3";

// import { checkRateLimit } from "../../core/security";
import { supabase } from "@/lib/supabase/server/supsbase";
import { PreviewService } from "@/app/services/preview";
import { BusinessInfoSchema } from "../../../../types/business";
import { checkUserProjectLimit } from "./helper";
import { LandingPageGenerator } from "@/app/services/claude-generator";

const s3 = new S3Service();
const generator = new LandingPageGenerator();
const previewService = new PreviewService(s3);

export async function POST(request: Request) {
  console.log("API: Starting generate-site endpoint");
  let siteId: string | undefined;
  console.log("API: Environment check", {
    region: process.env.CUSTOM_REGION,
    bucketName: process.env.S3_BUCKET_NAME,
    hasAccessKey: !!process.env.CUSTOM_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.CUSTOM_SECRET_ACCESS_KEY,
    projectLimit: process.env.NEXT_PUBLIC_PROJECT_LIMIT,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  try {
    // Check rate limit and API key
    // await checkRateLimit(request);

    console.log("API: Parsing request body");
    const body = await request.json();
    console.log("API: Request body received", { bodyKeys: Object.keys(body) });
    console.log("API: Validating with BusinessInfoSchema");
    const validatedData = BusinessInfoSchema.parse(body);
    console.log("API: Validation successful", {
      businessName: validatedData.name,
    });
    const { userId } = validatedData;
    console.log("API: UserId extracted", { userId });
    console.log("API: Checking project limit");
    // Check project limit before proceeding
    const canCreateProject = await checkUserProjectLimit(userId);
    console.log("API: Project limit check result", { canCreateProject });
    if (!canCreateProject) {
      console.log("API: Returning error response");
      return NextResponse.json(
        { error: "Project limit reached. Please upgrade your plan." },
        { status: 403 }
      );
    }

    console.log("API: Generating site ID");
    // we need to fetch all the css as js files from the template too
    siteId = `${validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

    console.log("API: Generated site ID", { siteId });

    console.log("API: Starting HTML generation");
    // #2: Generate HTML files
    const files = await generator.generate({
      ...validatedData,
      images: validatedData.images.map((img) => ({
        url: img.url,
        description: img.description,
        metadata: img.metadata,
      })),
    });
    console.log("API: HTML files generated", {
      fileCount: files.length,
      fileNames: files.map((f) => f.name),
    });

    // Combine HTML files and assets for deployment
    console.log("API: Preparing files for deployment");
    const allFiles: DeploymentFile[] = [
      ...files.map((f) => ({
        name: f.name,
        content: f.content,
        contentType: "text/html",
      })),
    ];

    console.log("API: Files prepared for deployment", {
      totalFiles: allFiles.length,
    });

    console.log("API: Starting S3 deployment and preview generation");
    // Deploy to S3
    try {
      console.log("API: S3 service initialized with", {
        bucketName: s3.bucketName,
        region: s3.region,
        endpoint: s3.websiteEndpoint,
      });
      const [deployment, previewUrl] = await Promise.all([
        s3.deploy(siteId, allFiles),
        previewService.generatePreview(
          files.find((f) => f.name === "index.html")?.content || "",
          siteId
        ),
      ]);
      console.log("API: Deployment and preview generation complete", {
        deploymentUrl: deployment.url,
        previewUrl,
      });

      console.log("API: Saving to Supabase");
      // Save to Supabase
      const { error } = await supabase.from("websites").insert({
        site_id: siteId,
        user_id: userId,
        name: validatedData.name,
        preview_url: previewUrl,
        project_url: deployment.url,
        hosting_status: "deployed",
      });

      if (error) {
        console.error("API: Error saving to Supabase:", error);
        console.error("Error saving to Supabase:", error);
      }

      console.log("API: Returning successful response");
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
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("API: Error generating site:", error);
    console.error("API: Error details:", JSON.stringify(error, null, 2));
    console.error(
      "API: Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    console.log("API: Attempting to update Supabase with failed status");
    // Update Supabase record with failed status if we have a siteId
    if (typeof siteId === "string") {
      const { error: updateError } = await supabase
        .from("websites")
        .update({ hosting_status: "failed" })
        .eq("site_id", siteId);

      if (updateError) {
        console.error(
          "API: Error updating hosting status in Supabase:",
          updateError
        );
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
