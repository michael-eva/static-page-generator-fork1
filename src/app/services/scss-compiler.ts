import * as sass from 'sass';  // Using modern sass package
import * as fs from 'fs';
import * as path from 'path';
import { BusinessInfo } from './generator';

/**
 * Compiles SCSS/Sass files with customized variables based on user color preferences
 */
export async function compileSassWithCustomColors(
  sassFilePath: string,
  businessInfo: BusinessInfo
): Promise<string> {
  // Skip customization if no color palette is defined
  if (!businessInfo.design_preferences?.color_palette?.roles) {
    // Just compile without customization
    return compileScssFile(sassFilePath);
  }

  const colorRoles = businessInfo.design_preferences.color_palette.roles;
  
  // Read the original SCSS file
  const originalScss = fs.readFileSync(sassFilePath, 'utf8');
  
  // Create custom color variables
  const customVariables = generateColorVariables(colorRoles);
  
  // Combine custom variables with the original SCSS
  const customizedScss = customVariables + originalScss;
  
  // Compile the customized SCSS
  try {
    const result = sass.compileString(customizedScss, {
      importers: [{
        findFileUrl(url) {
          // Handle imports relative to the original SCSS file
          if (url.startsWith('~')) {
            // Handle node_modules imports
            const nodeModulesPath = path.resolve(process.cwd(), 'node_modules', url.substring(1));
            return new URL(`file://${nodeModulesPath}`);
          }
          
          const dir = path.dirname(sassFilePath);
          const filePath = path.resolve(dir, url);
          return new URL(`file://${filePath}`);
        }
      }],
      style: 'compressed' // For production
    });
    
    return result.css;
  } catch (error) {
    console.error('Error compiling SCSS:', error);
    // Fallback to original compilation if customization fails
    return compileScssFile(sassFilePath);
  }
}

/**
 * Compiles an SCSS file without customization
 */
function compileScssFile(filePath: string): string {
  try {
    const result = sass.compile(filePath, {
      style: 'compressed' // For production
    });
    return result.css;
  } catch (error) {
    console.error(`Error compiling SCSS file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Generates SCSS variable declarations based on user color preferences
 */
function generateColorVariables(colorRoles: any): string {
  let variables = '// Custom color variables\n';
  
  if (colorRoles.primary) {
    variables += `$primary-color: ${colorRoles.primary} !default;\n`;
    variables += `$accent-color: ${colorRoles.primary} !default;\n`;
    variables += `$highlight-color: ${colorRoles.primary} !default;\n`;
  }
  
  if (colorRoles.background) {
    variables += `$background-color: ${colorRoles.background} !default;\n`;
    variables += `$bg-color: ${colorRoles.background} !default;\n`;
    variables += `$body-bg: ${colorRoles.background} !default;\n`;
  }
  
  if (colorRoles.text) {
    variables += `$text-color: ${colorRoles.text} !default;\n`;
    variables += `$body-color: ${colorRoles.text} !default;\n`;
    variables += `$font-color: ${colorRoles.text} !default;\n`;
  }
  
  if (colorRoles.textSecondary) {
    variables += `$text-secondary: ${colorRoles.textSecondary} !default;\n`;
    variables += `$muted-color: ${colorRoles.textSecondary} !default;\n`;
  }
  
  if (colorRoles.surface) {
    variables += `$surface-color: ${colorRoles.surface} !default;\n`;
    variables += `$card-bg: ${colorRoles.surface} !default;\n`;
    variables += `$container-bg: ${colorRoles.surface} !default;\n`;
    variables += `$sidebar-bg: ${colorRoles.surface} !default;\n`;
  }
  
  if (colorRoles.accent) {
    variables += `$accent-color: ${colorRoles.accent} !default;\n`;
    variables += `$secondary-color: ${colorRoles.accent} !default;\n`;
  }
  
  // Add template-specific variable overrides
  variables += `
// Common template variables
$btn-primary-bg: ${colorRoles.primary || '#007bff'} !default;
$link-color: ${colorRoles.primary || '#007bff'} !default;
$heading-color: ${colorRoles.text || '#fff'} !default;
$sidebar-color: ${colorRoles.surface || '#333'} !default;
$nav-link-color: ${colorRoles.primary || '#007bff'} !default;

// Make sure our variables take precedence
$important-primary: ${colorRoles.primary || '#007bff'} !important;
$important-background: ${colorRoles.background || '#fff'} !important;
$important-text: ${colorRoles.text || '#000'} !important;

// Include template override mixins
@mixin custom-colors {
  body, html {
    background-color: $background-color !important;
    color: $text-color !important;
  }
  
  .sidebar, #sidebar, .side-panel, .navigation, nav.main {
    background-color: $sidebar-bg !important;
  }
  
  a, .link, .btn-primary, button.primary {
    color: $link-color !important;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: $heading-color !important;
  }
}

// Call the mixin at the end of the compilation
`;

  return variables;
}

/**
 * Finds all SCSS/Sass files in a template directory
 */
export function findSassFiles(templateDir: string): string[] {
  const sassFiles: string[] = [];
  
  function searchDir(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        searchDir(filePath);
      } else if (file.endsWith('.scss') || file.endsWith('.sass')) {
        sassFiles.push(filePath);
      }
    }
  }
  
  searchDir(templateDir);
  return sassFiles;
}

/**
 * Compiles all Sass files in a template and creates customized CSS
 */
export async function compileTemplateWithCustomColors(
  templateDir: string,
  businessInfo: BusinessInfo
): Promise<Array<{ name: string; content: Buffer; contentType: string }>> {
  // Find all Sass files
  const sassFiles = findSassFiles(templateDir);
  
  // If no Sass files found, return empty array
  if (sassFiles.length === 0) {
    console.log('No Sass files found in template directory');
    return [];
  }
  
  // Compile each Sass file with custom colors
  const compiledFiles = await Promise.all(
    sassFiles.map(async (sassFile) => {
      try {
        const relativePath = path.relative(templateDir, sassFile);
        const cssFileName = relativePath
          .replace(/\.scss$/, '.css')
          .replace(/\.sass$/, '.css');
        
        console.log(`Compiling ${relativePath} with custom colors...`);
        const compiledCss = await compileSassWithCustomColors(sassFile, businessInfo);
        
        return {
          name: `assets/css/${path.basename(cssFileName)}`,
          content: Buffer.from(compiledCss, 'utf-8'),
          contentType: 'text/css'
        };
      } catch (error) {
        console.error(`Error compiling ${sassFile}:`, error);
        return null;
      }
    })
  );
  
  // Filter out any failed compilations
  return compiledFiles.filter(Boolean) as Array<{ name: string; content: Buffer; contentType: string }>;
}
