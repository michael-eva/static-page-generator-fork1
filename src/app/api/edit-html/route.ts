import { NextResponse } from "next/server";
import { HTMLEditor } from "@/app/services/html-editor";
import { S3Service } from "@/app/services/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const htmlEditor = new HTMLEditor();
const s3 = new S3Service();

export async function POST(request: Request) {
    try {
        const { siteId, prompt, html, action, imageUrl } = await request.json();

        if (!siteId) {
            return NextResponse.json(
                { error: "Missing siteId parameter" },
                { status: 400 }
            );
        }

        // If HTML is provided directly, save it
        if (html && action === 'deploy') {
            const result = await htmlEditor.deployChanges(siteId, html);
            return NextResponse.json(result);
        }

        // If there's an image URL in the prompt, modify the prompt to include image insertion
        let modifiedPrompt = prompt;
        if (imageUrl) {
            modifiedPrompt = `Insert the following image into the website: ${imageUrl}. ${prompt}`;
        }

        // Otherwise, use the AI editor with the prompt
        if (!modifiedPrompt) {
            return NextResponse.json(
                { error: "Either HTML content or prompt is required" },
                { status: 400 }
            );
        }

        const result = await htmlEditor.editHTML(siteId, modifiedPrompt);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in edit-html route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 