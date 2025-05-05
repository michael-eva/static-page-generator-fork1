import { v4 as uuidv4 } from 'uuid';

export function generateSiteId(businessName: string) {
  return `${businessName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${uuidv4().slice(0, 8)}`;
} 