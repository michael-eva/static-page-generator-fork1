export async function fetchTemplate(iframeSrc: string): Promise<string> {
  try {
    // Create the full URL by combining the origin with the template path
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const templatePath = iframeSrc.startsWith("/")
      ? iframeSrc
      : `/${iframeSrc}`;

    const fullUrl = `${baseUrl}${templatePath}`;
    console.log("fullUrl", fullUrl);
    console.log("parentDir", getParentDirectoryUrl(fullUrl));
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
}

export function getParentDirectoryUrl(url: string): string {
  const cleanUrl = url.replace(/\/$/, "");
  const segments = cleanUrl.split("/");
  segments.pop();
  return segments.join("/");
}

export async function fetchDirectoryContents(
  directoryUrl: string,
  fileList: string[]
): Promise<{ path: string; content: string | Buffer }[]> {
  const results = [];
  const baseUrl = directoryUrl.endsWith("/")
    ? directoryUrl
    : `${directoryUrl}/`;

  for (const filePath of fileList) {
    try {
      const fileUrl = `${baseUrl}${filePath}`;
      const response = await fetch(fileUrl);

      if (response.ok) {
        // Determine if this is likely a binary file based on extension
        const isBinary =
          /\.(png|jpg|jpeg|gif|webp|svg|pdf|ico|ttf|woff|woff2|eot|mp4|webm|mp3|wav)$/i.test(
            filePath
          );

        // Get content appropriately based on type
        let content;
        if (isBinary) {
          const arrayBuffer = await response.arrayBuffer();
          content = Buffer.from(arrayBuffer);
        } else {
          content = await response.text();
        }

        results.push({
          path: filePath,
          content,
        });
      } else {
        console.warn(
          `Failed to fetch ${filePath}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`Error fetching ${filePath}:`, error);
    }
  }

  return results;
}

export function determineContentType(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase() || "";

  const mimeTypes: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    txt: "text/plain",
    pdf: "application/pdf",
    xml: "application/xml",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };

  return mimeTypes[extension] || "application/octet-stream"; // Default binary type
}

export async function getDirectoryFileList(
  directoryUrl: string
): Promise<string[]> {
  const matches = directoryUrl.match(/\/templates-new\/([^\/]+)/);
  const templateName = matches?.[1];

  if (!templateName) {
    console.error("Could not extract template name from URL:", directoryUrl);
    return [];
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/template-files?template=${templateName}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get file list: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting file list:", error);
    return [];
  }
}
