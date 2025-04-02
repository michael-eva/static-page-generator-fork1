import { BusinessInfo } from "./generator";
import { processSassOutput } from "./sass-handler";

/**
 * Modifies CSS content based on user design preferences
 * Works with both regular CSS and compiled Sass output
 */
export function modifyCssContent(
  cssContent: string,
  businessInfo: BusinessInfo
): string {
  // Skip if no color palette is defined
  if (!businessInfo.design_preferences?.color_palette?.roles) {
    return cssContent;
  }

  const colorRoles = businessInfo.design_preferences.color_palette.roles;
  let modifiedCss = cssContent;

  // Common CSS color formats
  const colorRegex =
    /#[0-9a-f]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+\s*)?\)/gi;

  // Map primary color - usually buttons, links, key UI elements
  if (colorRoles.primary) {
    // Find and replace primary colors in CSS
    // This is a heuristic approach - we look for colors in specific contexts

    // Look for primary colors in button backgrounds, links, headers, etc.
    const primaryColorContexts = [
      {
        regex:
          /(button|\.btn|\.primary|a:hover|a:focus|h1|h2|\.nav|\.header|\.main-.*|\.bg-primary)[^}]*?background(-color)?:\s*([^;}]+)/gi,
        group: 3,
      },
      { regex: /(a|\.link|\.primary)[^}]*?color:\s*([^;}]+)/gi, group: 2 },
      { regex: /(border(-color)?:\s*)([^;}]+)/gi, group: 3 },
      {
        regex: /(--accent|--primary|--highlight|--brand):\s*([^;}]+)/gi,
        group: 2,
      },
    ];

    for (const context of primaryColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        // Only replace if it's a color value
        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.primary!);
        }
        return fullMatch;
      });
    }
  }

  // Map background color - page backgrounds
  if (colorRoles.background) {
    const bgColorContexts = [
      {
        regex:
          /(body|html|\.page|\.background|\.bg|\.wrapper|\.container|\.content)[^}]*?background(-color)?:\s*([^;}]+)/gi,
        group: 3,
      },
      { regex: /(--background|--bg):\s*([^;}]+)/gi, group: 2 },
    ];

    for (const context of bgColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.background!);
        }
        return fullMatch;
      });
    }

    // Handle CSS linear gradients
    if (colorRoles.primary) {
      // Replace background gradients - we'll use background color and primary color for the gradient
      const gradientRegex =
        /background-image:.*?linear-gradient\(\s*([^,]+),\s*([^\s]+)\s+\d+%,\s*([^\s]+)\s+\d+%\s*\)/gi;
      modifiedCss = modifiedCss.replace(gradientRegex, (direction) => {
        // Create a new gradient from background to primary color
        return `background-image: linear-gradient(${direction}, ${colorRoles.background} 15%, ${colorRoles.primary} 85%)`;
      });
    }
  }

  // Map text color
  if (colorRoles.text) {
    const textColorContexts = [
      {
        regex: /(body|html|p|\.text|\.content)[^}]*?color:\s*([^;}]+)/gi,
        group: 2,
      },
      { regex: /(--text|--text-primary|--color):\s*([^;}]+)/gi, group: 2 },
    ];

    for (const context of textColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.text!);
        }
        return fullMatch;
      });
    }
  }

  // Map secondary text color
  if (colorRoles.textSecondary) {
    const textSecondaryColorContexts = [
      {
        regex:
          /(\.subtitle|\.secondary|\.muted|small|footer)[^}]*?color:\s*([^;}]+)/gi,
        group: 2,
      },
      { regex: /(--text-secondary|--secondary):\s*([^;}]+)/gi, group: 2 },
    ];

    for (const context of textSecondaryColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.textSecondary!);
        }
        return fullMatch;
      });
    }
  }

  // Map accent color - highlights, badges, notifications
  if (colorRoles.accent) {
    const accentColorContexts = [
      {
        regex:
          /(\.accent|\.highlight|\.badge|\.notification|\.tag)[^}]*?background(-color)?:\s*([^;}]+)/gi,
        group: 3,
      },
      { regex: /(\.accent|\.highlight)[^}]*?color:\s*([^;}]+)/gi, group: 2 },
      { regex: /(--accent|--highlight):\s*([^;}]+)/gi, group: 2 },
    ];

    for (const context of accentColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.accent!);
        }
        return fullMatch;
      });
    }
  }

  // Map surface color - cards, modals, containers
  if (colorRoles.surface) {
    const surfaceColorContexts = [
      {
        regex:
          /(\.card|\.box|\.panel|\.modal|\.dialog|\.container|\.section)[^}]*?background(-color)?:\s*([^;}]+)/gi,
        group: 3,
      },
      { regex: /(--surface|--card|--container):\s*([^;}]+)/gi, group: 2 },
    ];

    for (const context of surfaceColorContexts) {
      modifiedCss = modifiedCss.replace(context.regex, (match, ...args) => {
        const fullMatch = match;
        const colorValue = args[context.group - 1];

        if (colorValue && colorValue.match(colorRegex)) {
          return fullMatch.replace(colorValue, colorRoles.surface!);
        }
        return fullMatch;
      });
    }
  }

  // Template-specific adjustments
  if (colorRoles.primary) {
    // Replace primary button colors
    const buttonPrimaryRegex =
      /\.button\.primary[^}]*?background-color:\s*([^;}]+)/gi;
    modifiedCss = modifiedCss.replace(buttonPrimaryRegex, (match, color) => {
      return match.replace(color, colorRoles.primary!);
    });

    // Button primary hover states
    const buttonHoverRegex =
      /\.button\.primary:hover[^}]*?background-color:\s*([^;}]+)/gi;
    modifiedCss = modifiedCss.replace(buttonHoverRegex, (match, color) => {
      return match.replace(color, colorRoles.primary!);
    });

    // Statistics colored boxes
    const statsRegex =
      /\.statistics li\.style\d[^}]*?background-color:\s*([^;}]+)/gi;
    modifiedCss = modifiedCss.replace(statsRegex, (match, color) => {
      return match.replace(color, colorRoles.primary!);
    });

    // Icon styles
    const iconStyleRegex = /\.icon\.style\d[^}]*?color:\s*([^;}]+)/gi;
    modifiedCss = modifiedCss.replace(iconStyleRegex, (match, color) => {
      return match.replace(color, colorRoles.primary!);
    });
  }

  // Process compiled Sass patterns
  modifiedCss = processSassOutput(modifiedCss, businessInfo);

  // Add custom CSS variable declarations at the top of the file
  const cssVars = `:root {
  ${colorRoles.primary ? `--primary-color: ${colorRoles.primary};` : ""}
  ${
    colorRoles.background ? `--background-color: ${colorRoles.background};` : ""
  }
  ${colorRoles.text ? `--text-color: ${colorRoles.text};` : ""}
  ${
    colorRoles.textSecondary
      ? `--text-secondary-color: ${colorRoles.textSecondary};`
      : ""
  }
  ${colorRoles.accent ? `--accent-color: ${colorRoles.accent};` : ""}
  ${colorRoles.surface ? `--surface-color: ${colorRoles.surface};` : ""}
}
`;

  return cssVars + modifiedCss;
}

/**
 * Determines if a file is a CSS file based on its path
 * Includes support for compiled Sass files
 */
export function isCssFile(filePath: string): boolean {
  return (
    filePath.endsWith(".css") ||
    filePath.includes("/css/") ||
    filePath.includes("/compiled/") ||
    filePath.includes("/dist/") ||
    (filePath.includes("/sass/") && filePath.endsWith(".css")) ||
    (filePath.includes("/scss/") && filePath.endsWith(".css"))
  );
}

/**
 * Process asset files, modifying CSS files with user design preferences
 * Handles both regular CSS and compiled Sass/SCSS
 */
export function processAssetFiles(
  assets: Array<{ name: string; content: Buffer; contentType: string }>,
  businessInfo: BusinessInfo
): Array<{ name: string; content: Buffer; contentType: string }> {
  return assets.map((asset) => {
    // Only process CSS files (including compiled Sass)
    if (asset.contentType === "text/css" || isCssFile(asset.name)) {
      try {
        // Convert Buffer to string for CSS processing
        const cssContent = asset.content.toString("utf-8");

        // Check if this is likely a compiled Sass file
        const isCompiledSass =
          asset.name.includes("/sass/") ||
          asset.name.includes("/scss/") ||
          // Look for Sass compilation comments
          cssContent.includes("/* line ") ||
          cssContent.includes("/* SCSS") ||
          cssContent.includes("/* Sass") ||
          cssContent.includes("/* Compass");

        // Apply our color modifications
        const modifiedCss = modifyCssContent(cssContent, businessInfo);

        console.log(
          `Processed ${isCompiledSass ? "compiled Sass" : "CSS"} file: ${
            asset.name
          }`
        );

        // Convert back to Buffer
        return {
          ...asset,
          content: Buffer.from(modifiedCss, "utf-8"),
        };
      } catch (error) {
        console.error(`Error processing CSS/Sass file ${asset.name}:`, error);
        return asset; // Return original on error
      }
    }

    // Return non-CSS assets unchanged
    return asset;
  });
}
