import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { supabase } from "@/lib/supabase/server/supsbase";

const s3Client = new S3Client({
  region: process.env.CUSTOM_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.CUSTOM_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CUSTOM_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const siteId = searchParams.get("siteId");

    if (!url && !siteId) {
      return NextResponse.json(
        { error: "Either URL or siteId parameter is required" },
        { status: 400 }
      );
    }

    let bucket: string;
    let key: string;

    if (siteId) {
      // If siteId is provided, fetch the project URL from the database
      const { data: website, error } = await supabase
        .from("websites")
        .select("project_url")
        .eq("site_id", siteId)
        .single();

      if (error || !website) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 });
      }

      const urlObj = new URL(website.project_url);
      bucket = urlObj.hostname.split(".")[0];
      key = urlObj.pathname.substring(1);
    } else {
      // If URL is provided, parse it directly
      const urlObj = new URL(url!);
      bucket = urlObj.hostname.split(".")[0];
      key = urlObj.pathname.substring(1);
    }

    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    // Convert the response body to a readable stream
    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // Create a new response with the content
    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.ContentType || "application/octet-stream"
    );
    headers.set("Content-Length", buffer.length.toString());

    // Set CORS headers to allow iframe embedding
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
