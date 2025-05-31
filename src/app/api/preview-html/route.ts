import { NextResponse } from "next/server";
import { S3Service } from "@/app/services/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// Import the shared cache from the edit-html route
// This is a reference to the same object used in edit-html route
// In a production app, you'd want to use a proper storage solution
import { previewCache, originalHtmlCache } from "../edit-html/route";

const s3 = new S3Service();

// Helper function to verify HTML is valid
function isValidHtml(html: string): boolean {
    if (!html || html.trim().length < 100) return false;
    
    // Check for basic HTML structure
    return html.includes("<!DOCTYPE html") && 
           html.includes("<html") && 
           html.includes("<body") && 
           html.includes("</html>");
}

// Helper function to log HTML content
function logHtmlContent(label: string, html: string | undefined) {
    if (!html) {
        console.log(`${label}: undefined or null`);
        return;
    }
    
    console.log(`${label} - Length: ${html.length}`);
    console.log(`${label} - Start (first 100 chars): ${html.substring(0, 100)}`);
    console.log(`${label} - End (last 100 chars): ${html.substring(html.length - 100)}`);
    
    // Check for essential HTML elements
    console.log(`${label} - Contains <!DOCTYPE html>: ${html.includes("<!DOCTYPE html")}`);
    console.log(`${label} - Contains <html: ${html.includes("<html")}`);
    console.log(`${label} - Contains <body: ${html.includes("<body")}`);
    console.log(`${label} - Contains </html>: ${html.includes("</html>")}`);
    
    // Log entire content in chunks for debugging
    logEntireContent(label, html);
}

// Log entire content in chunks to avoid truncation
function logEntireContent(label: string, content: string) {
    console.log(`${label} - FULL CONTENT START (length: ${content.length})`);
    
    // Log in chunks of 1000 characters to avoid truncation
    const chunkSize = 1000;
    for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, i + chunkSize);
        console.log(`${label} CHUNK ${Math.floor(i/chunkSize) + 1}/${Math.ceil(content.length/chunkSize)}: ${chunk}`);
    }
    
    console.log(`${label} - FULL CONTENT END`);
}

export async function GET(request: Request) {
    try {
        // Parse the URL to get the site ID parameter
        const url = new URL(request.url);
        const siteId = url.searchParams.get('siteId');
        const timestamp = url.searchParams.get('t') || 'none';

        if (!siteId) {
            console.error("Preview HTML: Missing siteId parameter");
            return NextResponse.json(
                { error: "Missing siteId parameter" },
                { status: 400 }
            );
        }

        console.log(`Preview request for siteId: ${siteId}, timestamp: ${timestamp}`);
        console.log(`Preview cache status: ${previewCache[siteId] ? 'Exists' : 'Not found'}`);
        console.log(`Original cache status: ${originalHtmlCache[siteId] ? 'Exists' : 'Not found'}`);

        // Check if we have a preview in the cache
        if (previewCache[siteId] && isValidHtml(previewCache[siteId])) {
            console.log("Serving cached preview HTML");
            
            // Log detailed content information
            logHtmlContent("PREVIEW_HTML_BEING_SERVED", previewCache[siteId]);
            
            // Return the cached HTML with proper content type and disable caching
            return new NextResponse(previewCache[siteId], {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
            });
        }
        
        // If the preview HTML exists but is invalid, try using the original
        if (previewCache[siteId] && !isValidHtml(previewCache[siteId]) && originalHtmlCache[siteId]) {
            console.warn("Invalid preview HTML detected, falling back to original HTML");
            console.log("Current preview HTML (invalid):");
            logHtmlContent("INVALID_PREVIEW_HTML", previewCache[siteId]);
            
            previewCache[siteId] = originalHtmlCache[siteId];
            console.log("Restoring from original HTML:");
            logHtmlContent("RESTORED_ORIGINAL_HTML", originalHtmlCache[siteId]);
            
            return new NextResponse(originalHtmlCache[siteId], {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
            });
        }

        // If no valid preview exists, fetch the current deployed HTML from S3
        try {
            console.log("Fetching HTML from S3");
            const command = new GetObjectCommand({
                Bucket: s3.bucketName,
                Key: `${siteId}/index.html`,
            });

            const response = await s3.getS3Client().send(command);
            if (!response.Body) {
                throw new Error("No content found in S3");
            }

            // Convert the stream to a string
            const currentHTML = await response.Body.transformToString();
            console.log(`S3 HTML length: ${currentHTML.length}`);
            logHtmlContent("HTML_FROM_S3", currentHTML);
            
            // Cache this HTML for future use
            if (isValidHtml(currentHTML)) {
                if (!originalHtmlCache[siteId]) {
                    console.log("Caching original HTML");
                    originalHtmlCache[siteId] = currentHTML;
                }
                
                // If no preview exists yet, set it to the current HTML
                if (!previewCache[siteId]) {
                    console.log("Setting preview cache to current HTML");
                    previewCache[siteId] = currentHTML;
                }
            }
            
            // Return the current HTML with proper content type and disable caching
            return new NextResponse(currentHTML, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
            });
        } catch (error) {
            console.error("Error fetching current HTML:", error);
            return NextResponse.json(
                { error: "Failed to fetch HTML content" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in preview-html route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 