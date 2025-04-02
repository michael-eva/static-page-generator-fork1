import { BusinessInfo } from "./generator";

/**
 * Generates a custom CSS file with user color preferences
 * This approach creates a new CSS file with high-specificity selectors to override template defaults
 */
export function generateCustomColorStylesheet(
  businessInfo: BusinessInfo
): string {
  // Skip if no color palette is defined
  if (!businessInfo.design_preferences?.color_palette?.roles) {
    return "";
  }

  const colorRoles = businessInfo.design_preferences.color_palette.roles;

  // Generate CSS variables for modern browsers
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

  // Create high-specificity overrides for common elements
  const customCSS = `
/* Custom color stylesheet generated for ${businessInfo.name} */
/* This stylesheet uses high-specificity selectors to override template defaults */

/* Background colors */
${
  colorRoles.background
    ? `
html body { 
  background-color: ${colorRoles.background} !important;
}

body::before,
body::after {
  background-color: ${colorRoles.background} !important;
}

body > div,
main,
.main {
  background-color: ${colorRoles.background} !important;
}
`
    : ""
}

/* Surface colors for sidebars, cards, containers */
${
  colorRoles.surface
    ? `
.sidebar,
#sidebar,
aside,
nav.main,
.main-nav,
.side-panel,
.panel,
.navigation {
  background-color: ${colorRoles.surface} !important;
}

.card,
.box,
.container,
.wrapper,
section,
article,
.panel,
.modal,
.dialog {
  background-color: ${colorRoles.surface} !important;
}
`
    : ""
}

/* Primary colors for buttons, links, accents */
${
  colorRoles.primary
    ? `
a:not(.button),
.link,
a:hover,
a:focus {
  color: ${colorRoles.primary} !important;
}

.button.primary,
button.primary,
input[type="submit"],
input[type="button"],
.btn-primary,
.accent {
  background-color: ${colorRoles.primary} !important;
  border-color: ${colorRoles.primary} !important;
}

.button.primary:hover,
button.primary:hover,
input[type="submit"]:hover,
.btn-primary:hover {
  background-color: ${colorRoles.primary} !important;
  filter: brightness(110%) !important;
}

.accent,
.highlight,
.primary-color,
.primary-bg {
  background-color: ${colorRoles.primary} !important;
}

.icon.style1,
.icon.style2,
.icon.style3,
.icon.style4,
.icon.style5 {
  color: ${colorRoles.primary} !important;
}

.statistics li.style1,
.statistics li.style2,
.statistics li.style3,
.statistics li.style4,
.statistics li.style5 {
  background-color: ${colorRoles.primary} !important;
}

header.major h2:after {
  background-color: ${colorRoles.primary} !important;
  background-image: linear-gradient(90deg, ${colorRoles.primary}, ${colorRoles.primary}) !important;
}
`
    : ""
}

/* Text colors */
${
  colorRoles.text
    ? `
body,
html,
p,
span,
div,
h1, h2, h3, h4, h5, h6,
label,
ul, ol, li {
  color: ${colorRoles.text} !important;
}

input, select, textarea {
  color: ${colorRoles.text} !important;
}

h1, h2, h3, h4, h5, h6 {
  color: ${colorRoles.text} !important;
}
`
    : ""
}

/* Secondary text colors */
${
  colorRoles.textSecondary
    ? `
.subtitle,
.secondary,
.muted,
small,
footer,
.subheading,
.meta {
  color: ${colorRoles.textSecondary} !important;
}
`
    : ""
}

/* Accent colors */
${
  colorRoles.accent
    ? `
.accent,
.badge,
.tag,
.notification,
.alert {
  background-color: ${colorRoles.accent} !important;
}
`
    : ""
}

/* Gradient backgrounds */
${
  colorRoles.background && colorRoles.primary
    ? `
[style*="linear-gradient"],
[class*="gradient"],
.bg-gradient,
body[style*="linear-gradient"] {
  background-image: linear-gradient(45deg, ${colorRoles.background} 15%, ${colorRoles.primary} 85%) !important;
}
`
    : ""
}

/* Border colors */
${
  colorRoles.primary
    ? `
.border,
.bordered,
input:focus,
select:focus,
textarea:focus {
  border-color: ${colorRoles.primary} !important;
}
`
    : ""
}

/* Template-specific overrides */
${
  colorRoles.background
    ? `
/* Stellar template */
body.is-preload *,
body.is-preload *:before,
body.is-preload *:after {
  background-color: ${colorRoles.background} !important;
}

/* Phantom template */
#wrapper > .bg {
  background-color: ${colorRoles.background} !important;
}

/* Forty template */
#banner:after {
  background-color: ${colorRoles.background} !important;
}
`
    : ""
}
`;

  // Combine all CSS
  return cssVars + customCSS;
}

/**
 * Creates a custom color CSS file for deployment
 */
export function createCustomColorStylesheet(businessInfo: BusinessInfo): {
  name: string;
  content: Buffer;
  contentType: string;
} {
  // Generate the CSS
  const cssContent = generateCustomColorStylesheet(businessInfo);

  // Create a deployment-ready asset
  return {
    name: "assets/css/custom-colors.css",
    content: Buffer.from(cssContent, "utf-8"),
    contentType: "text/css",
  };
}
