'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface DistributionPageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

export default function DistributionPage({ params }: DistributionPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [domainName, setDomainName] = useState<string | null>(null);
    const [certificateArn, setCertificateArn] = useState<string | null>(null);
    const router = useRouter();
    const { userId, projectId } = use(params);

    useEffect(() => {
        const setupData = localStorage.getItem('domainSetupData');
        if (!setupData) {
            router.push(`/${userId}/edit/${projectId}/domain/input`);
            return;
        }

        const { domainName, certificateArn } = JSON.parse(setupData);
        setDomainName(domainName);
        setCertificateArn(certificateArn);
    }, [userId, projectId, router]);

    const handleCreateDistribution = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/cloudfront/distribution?domainName=${domainName}&siteId=${projectId}&certificateArn=${certificateArn}`,
                {
                    headers: {
                        'user-id': userId
                    }
                }
            );
            const data = await response.json();

            if (data.distribution) {
                console.log("data.distribution", data.distribution);
                // Update the stored data with distribution information
                const setupData = JSON.parse(localStorage.getItem('domainSetupData') || '{}');
                localStorage.setItem('domainSetupData', JSON.stringify({
                    ...setupData,
                    distributionDomain: data.distribution.DomainName
                }));

                router.push(`/${userId}/edit/${projectId}/domain/dns?distributionDomain=${data.distribution.DomainName}`);
            } else {
                setError(data.error || "Failed to create distribution");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create distribution");
        } finally {
            setIsLoading(false);
        }
    };

    if (!domainName) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <CardTitle>Create CloudFront Distribution</CardTitle>
                    </div>
                    <CardDescription>
                        Your SSL certificate has been validated. Click the button below to create your CloudFront distribution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleCreateDistribution} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Distribution...
                            </>
                        ) : (
                            "Create Distribution"
                        )}
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
} 