import { BusinessInfo } from "./generator";

/**
 * Handles post-compilation processing of Sass files
 * This function applies color customizations to compiled Sass output
 */
export function processSassOutput(
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

  try {
    // 1. Handle Sass variable comments in compiled CSS
    const sassVarCommentRegex = /\/\*\s*\$([a-zA-Z\-_]+):\s*([^;\*]+)\s*\*\//g;
    modifiedCss = modifiedCss.replace(sassVarCommentRegex, (match, varName) => {
      // Replace color values in variable comments
      if (
        varName.includes("color") ||
        varName.includes("background") ||
        varName.includes("primary")
      ) {
        if (
          colorRoles.primary &&
          (varName.includes("primary") || varName.includes("accent"))
        ) {
          return `/* $${varName}: ${colorRoles.primary} */`;
        }
        if (colorRoles.background && varName.includes("background")) {
          return `/* $${varName}: ${colorRoles.background} */`;
        }
        if (
          colorRoles.text &&
          (varName.includes("text") || varName.includes("font"))
        ) {
          return `/* $${varName}: ${colorRoles.text} */`;
        }
      }
      return match;
    });
  } catch (error) {
    console.error("Error handling Sass variable comments:", error);
  }

  try {
    // 2. Compiled nested selectors often have longer selector chains
    // Here we look for deeply nested color declarations in compiled Sass
    const nestedColorRegex =
      /([#\.][\w\-\s\>\+\~\.:\[\]="'\*]+)\s+([#\.][\w\-\s\>\+\~\.:\[\]="'\*]+)[^}]*?(color|background-color|border-color):\s*([^;}]+)/gi;
    modifiedCss = modifiedCss.replace(
      nestedColorRegex,
      (match, parent, child, property, color) => {
        if (!color.match(colorRegex)) return match;

        // Apply color replacements based on context and property
        if (property.includes("background")) {
          if (
            colorRoles.background &&
            !match.toLowerCase().includes("primary") &&
            !match.toLowerCase().includes("button")
          ) {
            return match.replace(color, colorRoles.background);
          } else if (
            colorRoles.primary &&
            (match.toLowerCase().includes("primary") ||
              match.toLowerCase().includes("button"))
          ) {
            return match.replace(color, colorRoles.primary);
          }
        } else if (property === "color") {
          if (colorRoles.text && !match.toLowerCase().includes("secondary")) {
            return match.replace(color, colorRoles.text);
          } else if (
            colorRoles.textSecondary &&
            match.toLowerCase().includes("secondary")
          ) {
            return match.replace(color, colorRoles.textSecondary);
          }
        }

        return match;
      }
    );
  } catch (error) {
    console.error("Error handling nested Sass selectors:", error);
  }

  try {
    // 3. Handle mixin-generated properties
    // These often appear with complex class chains in compiled output
    if (colorRoles.primary) {
      // Look for primary button/element styles that may be from mixins
      const primaryStylesRegex =
        /\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*(?:\s*\.[_a-zA-Z]+[_a-zA-Z0-9-]*)*\s*\{\s*(?:[^}]*(?:accent|primary|highlight|button)[^}]*color:\s*([^;}]+)[^}]*)\}/gi;
      modifiedCss = modifiedCss.replace(primaryStylesRegex, (match, color) => {
        if (color && color.match(colorRegex) && colorRoles.primary) {
          return match.replace(color, colorRoles.primary);
        }
        return match;
      });
    }
  } catch (error) {
    console.error("Error handling mixin-generated properties:", error);
  }

  return modifiedCss;
}
