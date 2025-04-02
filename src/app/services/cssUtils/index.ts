import { BusinessInfo } from "../generator";

// Maps color roles to common CSS property patterns
const COLOR_ROLE_PATTERNS = {
  background: [
    /background(-color)?:\s*([^;]+);/g,
    /background(-color)?:/g,
    /background:/g,
  ],
  surface: [/--surface-color:\s*([^;]+);/g],
  text: [/color:\s*([^;]+);/g, /color:/g],
  textSecondary: [/--secondary-text-color:\s*([^;]+);/g],
  primary: [
    /--primary-color:\s*([^;]+);/g,
    /--main-color:\s*([^;]+);/g,
    /--accent-color:\s*([^;]+);/g,
  ],
  accent: [/--accent-color:\s*([^;]+);/g, /--highlight-color:\s*([^;]+);/g],
};

/**
 * Common CSS selectors related to different color roles
 */
const SELECTOR_ROLE_MAPPING = {
  background: [
    "body",
    "html",
    ".bg",
    ".background",
    ".main-bg",
    "#wrapper",
    "#main",
  ],
  surface: [
    ".card",
    ".container",
    ".section",
    ".panel",
    ".box",
    ".tile",
    "article",
    "section",
  ],
  text: [
    "body",
    "p",
    ".text",
    ".content",
    "h1, h2, h3, h4, h5, h6",
    ".title",
    ".heading",
  ],
  textSecondary: [
    ".subtitle",
    ".meta",
    "small",
    "footer",
    ".footer",
    ".caption",
    ".secondary",
  ],
  primary: [
    ".primary",
    ".button",
    "button",
    ".btn",
    "a",
    ".link",
    ".nav",
    "header",
    ".header",
    ".main-color",
  ],
  accent: [
    ".accent",
    ".highlight",
    ":hover",
    ":focus",
    ":active",
    ".active",
    ".selected",
    ".badge",
    ".tag",
  ],
};

/**
 * Process a CSS string to replace colors based on user preferences
 */
export function processCssWithUserPreferences(
  cssContent: string,
  businessInfo: BusinessInfo
): string {
  const colorPreferences =
    businessInfo.design_preferences?.color_palette?.roles;

  if (!colorPreferences) {
    console.log("No color preferences found, returning original CSS");
    return cssContent;
  }

  console.log("Processing CSS with user preferences:", colorPreferences);
  let processedCss = cssContent;

  // Replace color variables if they exist in the CSS
  for (const [role, value] of Object.entries(colorPreferences)) {
    if (!value) continue;

    console.log(`Processing role: ${role} with value: ${value}`);

    // Try to find and replace color variables
    const patterns =
      COLOR_ROLE_PATTERNS[role as keyof typeof COLOR_ROLE_PATTERNS] || [];
    for (const pattern of patterns) {
      const matches = [...cssContent.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`Found ${matches.length} matches for pattern ${pattern}`);

        // Replace this pattern with the new color
        processedCss = processedCss.replace(pattern, (match) => {
          return match.replace(/:[^;]+;/, `: ${value};`);
        });
      }
    }

    // Target selectors commonly associated with this role
    const selectors =
      SELECTOR_ROLE_MAPPING[role as keyof typeof SELECTOR_ROLE_MAPPING] || [];
    for (const selector of selectors) {
      const selectorRegex = new RegExp(`${selector}\\s*{[^}]*}`, "g");
      const matches = [...cssContent.matchAll(selectorRegex)];

      if (matches.length > 0) {
        console.log(`Found ${matches.length} selector matches for ${selector}`);

        for (const match of matches) {
          const originalSelector = match[0];
          let updatedSelector = originalSelector;

          if (role === "background" || role === "surface") {
            const bgPattern = /background(-color)?:\s*[^;]+;/g;
            if (bgPattern.test(updatedSelector)) {
              updatedSelector = updatedSelector.replace(
                bgPattern,
                `background-color: ${value};`
              );
            } else {
              updatedSelector = updatedSelector.replace(
                /{/,
                `{ background-color: ${value};`
              );
            }
          }

          if (role === "text" || role === "textSecondary") {
            const colorPattern = /color:\s*[^;]+;/g;
            if (colorPattern.test(updatedSelector)) {
              updatedSelector = updatedSelector.replace(
                colorPattern,
                `color: ${value};`
              );
            } else {
              updatedSelector = updatedSelector.replace(
                /{/,
                `{ color: ${value};`
              );
            }
          }

          if (role === "primary" || role === "accent") {
            if (
              selector.includes("button") ||
              selector.includes(".btn") ||
              selector.includes(".button")
            ) {
              // For buttons, likely want background-color
              const bgPattern = /background(-color)?:\s*[^;]+;/g;
              if (bgPattern.test(updatedSelector)) {
                updatedSelector = updatedSelector.replace(
                  bgPattern,
                  `background-color: ${value};`
                );
              } else {
                updatedSelector = updatedSelector.replace(
                  /{/,
                  `{ background-color: ${value};`
                );
              }
            } else if (selector.includes("a") || selector.includes(".link")) {
              // For links, likely want text color
              const colorPattern = /color:\s*[^;]+;/g;
              if (colorPattern.test(updatedSelector)) {
                updatedSelector = updatedSelector.replace(
                  colorPattern,
                  `color: ${value};`
                );
              } else {
                updatedSelector = updatedSelector.replace(
                  /{/,
                  `{ color: ${value};`
                );
              }
            }
          }

          // Replace the original selector with our updated one
          if (updatedSelector !== originalSelector) {
            processedCss = processedCss.replace(
              originalSelector,
              updatedSelector
            );
          }
        }
      }
    }
  }

  // Add a custom CSS section at the end
  processedCss += generateCustomCssOverrides(colorPreferences);

  return processedCss;
}

/**
 * Generate additional CSS overrides for color preferences
 */
function generateCustomCssOverrides(colorPreferences: any): string {
  let customCss = "\n\n/* Custom color overrides */\n";

  if (colorPreferences.background) {
    customCss += `body, html, #wrapper { background-color: ${colorPreferences.background} !important; }\n`;
  }

  if (colorPreferences.text) {
    customCss += `body, p, .content { color: ${colorPreferences.text} !important; }\n`;
  }

  if (colorPreferences.primary) {
    customCss += `.button, button, .btn, .primary, header, nav a { 
      background-color: ${colorPreferences.primary} !important; 
      border-color: ${colorPreferences.primary} !important;
    }\n`;
    customCss += `a, .link { color: ${colorPreferences.primary} !important; }\n`;
  }

  if (colorPreferences.accent) {
    customCss += `.accent, .highlight, .badge, .tag { 
      background-color: ${colorPreferences.accent} !important; 
      border-color: ${colorPreferences.accent} !important;
    }\n`;
    customCss += `.accent-text { color: ${colorPreferences.accent} !important; }\n`;
    customCss += `a:hover, .link:hover, button:hover, .btn:hover { 
      filter: brightness(1.1) !important; 
      transition: all 0.3s ease !important;
    }\n`;
  }

  return customCss;
}

/**
 * Determine if a file is a CSS file that should be processed
 */
export function shouldProcessCssFile(filename: string): boolean {
  if (!filename.endsWith(".css")) return false;

  // Skip some common CSS files that might not need processing
  const skipList = [
    "normalize.css",
    "reset.css",
    "fontawesome",
    "font-awesome",
  ];

  return !skipList.some((skipItem) => filename.includes(skipItem));
}
