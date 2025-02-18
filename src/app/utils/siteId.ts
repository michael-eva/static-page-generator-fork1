export function generateSiteId(businessName: string) {
  return `${businessName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${crypto.randomUUID().slice(0, 8)}`;
} 