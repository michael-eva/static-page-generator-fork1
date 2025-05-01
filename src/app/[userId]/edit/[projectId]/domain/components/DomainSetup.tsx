'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Copy, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";

interface ValidationRecord {
    domainName: string;
    validationRecord: {
        Name: string;
        Type: string;
        Value: string;
    };
    status: string;
}

interface DomainSetupProps {
    userId: string;
    siteId: string;
}

export default function DomainSetup({ userId, siteId }: DomainSetupProps) {
    const [domainName, setDomainName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationRecords, setValidationRecords] = useState<ValidationRecord[] | null>(null);
    const [certificateArn, setCertificateArn] = useState<string | null>(null);
    const [step, setStep] = useState<"input" | "validation" | "distribution" | "dns" | "complete">("input");
    const [distributionDomain, setDistributionDomain] = useState<string | null>(null);
    const [nameservers, setNameservers] = useState<string[]>([]);
    const [dnsSetupOption, setDnsSetupOption] = useState<"nameservers" | "alias">("nameservers");

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/cloudfront/certificate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    domainName,
                    useRoute53: false,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to initiate domain setup");
            }

            const data = await response.json();

            if (data.validationRecords) {
                setValidationRecords(data.validationRecords);
                setCertificateArn(data.certificateArn);
                setStep("validation");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckValidation = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/cloudfront/certificate/status?domainName=${domainName}&certificateArn=${certificateArn}`
            );
            const data = await response.json();

            if (data.status === "ISSUED") {
                setStep("distribution");
            } else {
                toast("Certificate validation is still in progress. Please try again in a few minutes.");
            }
        } catch (err: any) {
            setError(err.message || "Failed to check validation status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDistribution = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/cloudfront/distribution?domainName=${domainName}&siteId=${siteId}&certificateArn=${certificateArn}`,
                {
                    headers: {
                        'user-id': userId
                    }
                }
            );
            const data = await response.json();

            if (data.distribution) {
                setDistributionDomain(data.distribution.DomainName);
                setStep("dns");
            } else {
                setError(data.error || "Failed to create distribution");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create distribution");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupDNS = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/cloudfront/dns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    domainName,
                    distributionDomain,
                    setupOption: dnsSetupOption,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to setup DNS records");
            }

            const data = await response.json();
            if (dnsSetupOption === "nameservers") {
                setNameservers(data.nameservers || []);
            }
            setStep("complete");
        } catch (err: any) {
            setError(err.message || "Failed to setup DNS records");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {step === "input" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Connect Your Domain</CardTitle>
                        <CardDescription>
                            Enter your domain name to start the setup process. We&apos;ll help you configure SSL and DNS settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="domain" className="text-sm font-medium">
                                    Domain Name
                                </label>
                                <Input
                                    id="domain"
                                    value={domainName}
                                    onChange={(e) => setDomainName(e.target.value)}
                                    placeholder="example.com"
                                    className="font-mono"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter the root domain or subdomain you want to use
                                </p>
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Start Setup
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {step === "validation" && validationRecords && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <CardTitle>Domain Validation Required</CardTitle>
                            <Badge variant="outline">Step 1 of 2</Badge>
                        </div>
                        <CardDescription>
                            Add these DNS records to your domain provider to validate ownership
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-6">
                            {validationRecords.map((record, index) => (
                                <div key={index} className="rounded-lg border p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">{record.domainName}</h3>
                                        <Badge>{record.status}</Badge>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-muted-foreground">Name (Host)</label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-muted p-2 rounded-md font-mono text-sm">
                                                    {record.validationRecord.Name}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleCopy(record.validationRecord.Name)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                                            <code className="bg-muted p-2 rounded-md font-mono text-sm">
                                                {record.validationRecord.Type}
                                            </code>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium text-muted-foreground">Value (Points to)</label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-muted p-2 rounded-md font-mono text-sm break-all">
                                                    {record.validationRecord.Value}
                                                </code>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleCopy(record.validationRecord.Value)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">Next Steps</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>Add these DNS records to your domain provider</li>
                                    <li>Wait for certificate validation (can take up to 30 minutes)</li>
                                    <li>Once validated, we&apos;ll help you set up the final CNAME record</li>
                                </ol>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button onClick={handleCheckValidation} disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        "Check Validation Status"
                                    )}
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Certificate validation can take up to 30 minutes
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "distribution" && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <CardTitle>Create CloudFront Distribution</CardTitle>
                            <Badge variant="outline">Step 2 of 2</Badge>
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
            )}

            {step === "dns" && distributionDomain && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <CardTitle>Setup DNS Records</CardTitle>
                            <Badge variant="outline">Step 3 of 3</Badge>
                        </div>
                        <CardDescription>
                            Choose how you want to connect your domain to CloudFront.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="alias"
                                    name="dnsSetup"
                                    value="alias"
                                    checked={dnsSetupOption === "alias"}
                                    onChange={() => setDnsSetupOption("alias")}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="alias" className="text-sm font-medium">
                                    Add ALIAS Record (Recommended)
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="nameservers"
                                    name="dnsSetup"
                                    value="nameservers"
                                    checked={dnsSetupOption === "nameservers"}
                                    onChange={() => setDnsSetupOption("nameservers")}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="nameservers" className="text-sm font-medium">
                                    Use Route 53 Nameservers
                                </label>
                            </div>
                        </div>

                        {dnsSetupOption === "nameservers" ? (
                            <div className="space-y-4">
                                {/* <p className="text-sm text-muted-foreground">
                                    We'll create a Route 53 hosted zone for your domain. You'll need to update your domain registrar's nameservers to:
                                </p>
                                <div className="bg-muted p-4 rounded-md space-y-2">
                                    <div className="flex items-center justify-between">
                                        <code className="font-mono">{domainName}</code>
                                        <span className="text-muted-foreground">A → {distributionDomain}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <code className="font-mono">www.{domainName}</code>
                                        <span className="text-muted-foreground">A → {distributionDomain}</span>
                                    </div>
                                </div> */}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Add the following ALIAS record to your current DNS provider:
                                </p>
                                <div className="bg-muted p-4 rounded-md space-y-2">
                                    <div className="flex items-center justify-between">
                                        <code className="font-mono">@</code>
                                        <span className="text-muted-foreground">ALIAS → {distributionDomain}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <code className="font-mono">www</code>
                                        <span className="text-muted-foreground">ALIAS → {distributionDomain}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    If your DNS provider doesn&apos;t support ALIAS records, you can use your domain registrars redirect feature.
                                </p>
                            </div>
                        )}

                        <Button onClick={handleSetupDNS} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting up DNS...
                                </>
                            ) : (
                                "Setup DNS Records"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === "complete" && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <CardTitle>Setup Complete</CardTitle>
                            <Badge variant="default">Complete</Badge>
                        </div>
                        <CardDescription>
                            Your domain setup is complete! Follow these final steps to make your site accessible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Success!</AlertTitle>
                            <AlertDescription>
                                Your domain {domainName} has been successfully connected to your site.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <h4 className="font-semibold">Next Steps</h4>
                            {dnsSetupOption === "nameservers" ? (
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>Update your domain registrar&apos;s nameservers to:</li>
                                    <div className="ml-6 space-y-1">
                                        {nameservers.map((ns, index) => (
                                            <code key={index} className="block font-mono bg-muted p-2 rounded-md">
                                                {ns}
                                            </code>
                                        ))}
                                    </div>
                                    <li>Wait for DNS changes to propagate (can take up to 48 hours)</li>
                                    <li>Your site will be accessible at:</li>
                                    <div className="ml-6 space-y-1">
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            https://{domainName}
                                        </code>
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            https://www.{domainName}
                                        </code>
                                    </div>
                                </ol>
                            ) : (
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>Add the following ALIAS records to your current DNS provider:</li>
                                    <div className="ml-6 space-y-1">
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            @ → {distributionDomain}
                                        </code>
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            www → {distributionDomain}
                                        </code>
                                    </div>
                                    <li>If your DNS provider doesn&apos;t support ALIAS records, use your domain registrars redirect feature.</li>
                                    <li>Wait for DNS changes to propagate (can take up to 48 hours)</li>
                                    <li>Your site will be accessible at:</li>
                                    <div className="ml-6 space-y-1">
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            https://{domainName}
                                        </code>
                                        <code className="block font-mono bg-muted p-2 rounded-md">
                                            https://www.{domainName}
                                        </code>
                                    </div>
                                </ol>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

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