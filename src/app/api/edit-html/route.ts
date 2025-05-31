import { NextResponse } from "next/server";
import { HTMLEditor } from "@/app/services/html-editor";
import { S3Service } from "@/app/services/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const htmlEditor = new HTMLEditor("cerebras", "meta-llama/Llama-3.3-70B-Instruct");
const s3 = new S3Service();

// Store preview HTML temporarily (in-memory cache)
// In a production app, you'd want to use a more persistent solution
export const previewCache: Record<string, string> = {};

// Also store the original HTML to restore in case of failures
export const originalHtmlCache: Record<string, string> = {};

// Store changesets for UI display
export const changesetCache: Record<string, any> = {};

// Helper function to log HTML content in chunks
function logHtmlContent(label: string, html: string | undefined) {
    if (!html) {
        console.log(`${label}: undefined or null`);
        return;
    }
    
    console.log(`${label} - Length: ${html.length}`);
    console.log(`${label} - Start (first 200 chars): ${html.substring(0, 200)}`);
    console.log(`${label} - End (last 200 chars): ${html.substring(html.length - 200)}`);
    
    // Check for essential HTML elements
    console.log(`${label} - Contains <!DOCTYPE html>: ${html.includes("<!DOCTYPE html")}`);
    console.log(`${label} - Contains <html: ${html.includes("<html")}`);
    console.log(`${label} - Contains <body: ${html.includes("<body")}`);
    console.log(`${label} - Contains </html>: ${html.includes("</html>")}`);
}

export async function POST(request: Request) {
    try {
        const { siteId, prompt, html, action, imageUrl } = await request.json();

        if (!siteId) {
            return NextResponse.json(
                { error: "Missing siteId parameter" },
                { status: 400 }
            );
        }

        console.log(`Edit-HTML request - siteId: ${siteId}, action: ${action}`);

        // If HTML is provided directly, save it
        if (action === 'deploy') {
            let htmlToSave = html;
            
            // If 'USE_PREVIEW' is specified, use the cached preview HTML
            if (html === 'USE_PREVIEW') {
                if (!previewCache[siteId]) {
                    console.error(`No preview HTML found for siteId: ${siteId}`);
                    return NextResponse.json(
                        { error: "No preview HTML found. Please generate a preview first." },
                        { status: 400 }
                    );
                }
                console.log(`Using cached preview HTML for deployment, length: ${previewCache[siteId].length}`);
                logHtmlContent("PREVIEW HTML FOR DEPLOYMENT", previewCache[siteId]);
                htmlToSave = previewCache[siteId];
            }
            
            const result = await htmlEditor.deployChanges(siteId, htmlToSave);
            
            // If deployment was successful, clear the caches
            if (result.success) {
                console.log(`Deployment successful, clearing caches for siteId: ${siteId}`);
                delete previewCache[siteId];
                delete originalHtmlCache[siteId];
                delete changesetCache[siteId];
            }
            
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
        
        // Before generating new content, fetch and store the original HTML if we don't have it yet
        if (!originalHtmlCache[siteId]) {
            try {
                console.log(`Fetching original HTML for siteId: ${siteId}`);
                const command = new GetObjectCommand({
                    Bucket: s3.bucketName,
                    Key: `${siteId}/index.html`,
                });
                
                const response = await s3.getS3Client().send(command);
                if (response.Body) {
                    const currentHTML = await response.Body.transformToString();
                    originalHtmlCache[siteId] = currentHTML;
                    console.log(`Stored original HTML in cache, length: ${currentHTML.length}`);
                    logHtmlContent("ORIGINAL HTML", currentHTML);
                    
                    // Initially set the preview cache to the original HTML
                    if (!previewCache[siteId]) {
                        previewCache[siteId] = currentHTML;
                        console.log(`Initialized preview cache with original HTML`);
                    }
                }
            } catch (error) {
                console.error("Error fetching original HTML:", error);
                // Non-blocking, we can continue anyway
            }
        }

        console.log(`Sending prompt to HTML editor: "${modifiedPrompt.substring(0, 100)}..."`);
        const result = await htmlEditor.editHTML(siteId, modifiedPrompt);
        
        // If successful, cache the preview HTML
        if (result.success && result.new_html) {
            previewCache[siteId] = result.new_html;
            console.log(`Stored new HTML in preview cache, length: ${result.new_html.length}`);
            logHtmlContent("NEW HTML STORED IN PREVIEW", result.new_html);
            
            // Store the changeset if available
            if (result.changes) {
                changesetCache[siteId] = result.changes;
                console.log(`Stored changeset in cache: ${result.changes.title}`);
                console.log(`Applied ${result.changes.changes.length} changes`);
            }
        } else if (originalHtmlCache[siteId]) {
            // If edit failed but we have the original HTML, use that for preview
            console.log("Edit failed, restoring original HTML to preview cache");
            previewCache[siteId] = originalHtmlCache[siteId];
            logHtmlContent("RESTORED ORIGINAL HTML TO PREVIEW", originalHtmlCache[siteId]);
        }
        
        // Return raw_response field if it exists, and changeset if available
        return NextResponse.json({
            ...result,
            raw_response: result.raw_response, // This will be undefined if not present
            preview_cached: !!previewCache[siteId], // Add a field to indicate if preview is cached
            changeset: result.changes // Return the changeset to the client
        });
    } catch (error) {
        console.error("Error in edit-html route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 