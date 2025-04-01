import fs from 'fs';
import path from 'path';

export type AssetFile = {
  name: string;
  content: Buffer;
  contentType: string;
};

const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

export async function fetchAssets(templatePath: string): Promise<AssetFile[]> {
  const assets: AssetFile[] = [];
  const assetsDir = path.join(templatePath, 'assets');
  
  console.log('Fetching assets from:', assetsDir);

  function processDirectory(currentPath: string, basePath: string) {
    console.log('Processing directory:', currentPath);
    const items = fs.readdirSync(currentPath);
    console.log('Found items:', items);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relativePath = path.relative(basePath, fullPath);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        processDirectory(fullPath, basePath);
      } else {
        const content = fs.readFileSync(fullPath);
        console.log('Adding asset:', relativePath);
        assets.push({
          name: `assets/${relativePath}`,
          content: content,
          contentType: getMimeType(item)
        });
      }
    }
  }

  if (fs.existsSync(assetsDir)) {
    console.log('Assets directory exists');
    processDirectory(assetsDir, assetsDir);
  } else {
    console.log('Assets directory does not exist:', assetsDir);
  }

  console.log('Total assets found:', assets.length);
  return assets;
} 