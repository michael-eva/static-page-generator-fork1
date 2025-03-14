import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  console.log("API route called with URL:", request.url);

  // Get the template parameter from the URL
  const searchParams = request.nextUrl.searchParams;
  const template = searchParams.get("template");

  console.log("Template parameter:", template);

  if (!template) {
    console.log("Error: Missing template parameter");
    return NextResponse.json(
      { error: "Template parameter is required" },
      { status: 400 }
    );
  }

  try {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates-new",
      template
    );
    console.log("Looking for template at path:", templatePath);

    // Verify the path exists and is within our project boundaries (security check)
    try {
      const realPath = fs.realpathSync(templatePath);
      console.log("Real path:", realPath);

      if (!realPath.startsWith(process.cwd())) {
        console.log("Security error: Path outside project root");
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } catch (pathError) {
      console.error("Error resolving real path:", pathError);
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(templatePath)) {
      console.log("Template directory not found");
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    console.log("Template directory exists, getting files...");
    const files = getAllFiles(templatePath);
    console.log("Found files:", files.length);

    // Convert absolute paths to relative paths
    const relativeFiles = files.map((file) =>
      file.replace(templatePath + path.sep, "").replace(/\\/g, "/")
    );
    console.log("Relative files sample:", relativeFiles.slice(0, 3));

    return NextResponse.json(relativeFiles);
  } catch (error) {
    console.error("Error listing template files:", error);
    return NextResponse.json(
      { error: "Failed to list template files" },
      { status: 500 }
    );
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  try {
    console.log("Scanning directory:", dirPath);
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          console.log("Found subdirectory:", file);
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
          console.log("Found file:", file);
          arrayOfFiles.push(filePath);
        }
      } catch (statError) {
        console.error(`Error checking file ${file}:`, statError);
      }
    });

    return arrayOfFiles;
  } catch (readError) {
    console.error(`Error reading directory ${dirPath}:`, readError);
    return arrayOfFiles;
  }
}
