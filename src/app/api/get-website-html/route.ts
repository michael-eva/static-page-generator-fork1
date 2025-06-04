import { NextResponse } from "next/server";
import { S3Service } from "@/app/services/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Service();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');

        if (!siteId) {
            return NextResponse.json(
                { error: "Missing siteId parameter" },
                { status: 400 }
            );
        }

        // Get the current HTML content from S3
        const command = new GetObjectCommand({
            Bucket: s3.bucketName,
            Key: `${siteId}/index.html`,
        });

        const response = await s3.getS3Client().send(command);
        if (!response.Body) {
            throw new Error("No content found in S3");
        }

        // Convert the stream to a string
        const html = await response.Body.transformToString();

        return NextResponse.json({ html });
    } catch (error) {
        console.error("Error fetching website HTML:", error);
        return NextResponse.json(
            { error: "Failed to fetch website HTML" },
            { status: 500 }
        );
    }
} 