'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export default function ConfigureDomain() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');
  const previewUrl = searchParams.get('previewUrl');
  const [deploymentStatus, setDeploymentStatus] = useState<'completed' | 'not_found'>('not_found');

  useEffect(() => {
    const checkDeployment = async () => {
      try {
        const response = await fetch(`/api/site-status/${siteId}`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
          }
        });
        
        if (!response.ok) throw new Error('Failed to check deployment status');
        
        const data = await response.json();
        setDeploymentStatus(data.status);
      } catch (error) {
        console.error('Error checking deployment:', error);
      }
    };

    const interval = setInterval(checkDeployment, 5000);
    checkDeployment();

    return () => clearInterval(interval);
  }, [siteId]);

  if (!siteId || !previewUrl) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Missing required parameters. Please return to the questionnaire.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Configure Your Domain</h1>
      
      {/* Deployment Status */}
      <Alert variant={deploymentStatus === 'completed' ? 'default' : 'destructive'}>
        <AlertDescription>
          {deploymentStatus === 'completed' 
            ? 'Your site has been deployed successfully!'
            : 'Your site is being deployed...'}
        </AlertDescription>
      </Alert>

      {/* DNS Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To connect your domain, add the following DNS record to your domain provider:</p>
          <div className="bg-gray-100 p-4 rounded-md">
            <p><strong>Record Type:</strong> CNAME</p>
            <p><strong>Name:</strong> {siteId}</p>
            <p><strong>Value:</strong> {`${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`}</p>
          </div>
          <p className="text-sm text-gray-600">
            Note: DNS changes can take up to 48 hours to propagate globally.
          </p>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Site Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {deploymentStatus === 'completed' ? (
            <div className="w-full aspect-[16/9] border rounded-lg overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Website Preview"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center">
              <p>Loading preview...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 