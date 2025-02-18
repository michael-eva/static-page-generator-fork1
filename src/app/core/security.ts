export async function checkRateLimit(request: Request): Promise<string> {
  // Get API key from header
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new Error('Invalid API key');
  }
  
  // TODO: Implement actual rate limiting
  return apiKey;
} 