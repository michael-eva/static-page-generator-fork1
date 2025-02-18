export interface Template {
  index?: number;
  src: string; // Path to thumbnail image
  name: string; // Display name
  iframeSrc: string; // Path to template HTML file
  colorPalette: string;
  description?: string; // Optional detailed description
  offering?: string[]; // Optional array of offerings
  images?: {
    path: string;
    description: string;
  }[];
  style?: string;
  tagline?: string;
  logoUrl?: string;
}

export const getTemplatePath = (templateId: string) =>
  `/templates/${templateId}`;
export const getTemplateHtmlPath = (templateId: string) =>
  `/templates/${templateId}/index.html`;
export const getTemplateThumbnailPath = (templateId: string) =>
  `/templates/${templateId}/thumbnail/thumbnail.png`;
export const getTemplateImagesPath = (templateId: string) =>
  `/templates/${templateId}/images`;
