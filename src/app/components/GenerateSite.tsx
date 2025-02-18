/* eslint-disable @typescript-eslint/no-unused-vars */

type BusinessInfo = {
  name: string;
  description: string;
  offerings: string[];
  location: string;
  images?: string[];
  design_preferences?: string;
};

async function generateSite(businessInfo: BusinessInfo) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(businessInfo),
  });

  if (!response.ok) {
    throw new Error('Failed to generate site');
  }

  const data = await response.json();
  return data;
}