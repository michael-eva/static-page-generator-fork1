"use client"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from "@/components/ui/button"
import React, { useState, useEffect, useRef } from 'react'
import { generateSiteId } from '../utils/siteId'
import { useDialog } from '../../hooks/use-dialog'
import { CustomDialog } from '@/components/dialog'
import { WebsiteBuilderContent } from './components/WebsiteBuilderContent'
import { FormProgressTracker } from './components/FormProgressTracker'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BusinessInfoSchema } from "@/types/business";
import { useSupabaseSession } from '@/hooks/useSupabaseSession'
import { useRouter } from 'next/navigation'
import { useProjectLimits } from '@/hooks/useProjectLimits'

const formSchema = z.object({
    business_info: BusinessInfoSchema.omit({ userId: true }).extend({
        images: z.array(z.object({
            path: z.string(),
            description: z.string(),
            file: z.any().optional()
        })),
        branding: z.object({
            logo_url: z.string(),
            default_logo_url: z.string().optional(),
            logo_file: z.any().optional().nullable(),
            tagline: z.string(),
            siteId: z.string()
        }),
        contact_preferences: z.object({
            type: z.enum(["form", "email", "phone", "subscribe", ""]),
            business_hours: z.string(),
            contact_email: z.string(),
            contact_phone: z.string()
        })
    })
});

type FormSchema = z.infer<typeof formSchema>;
export type { FormSchema };

// Add this near the top with other constants
const TABS = ["basic", "offerings", "visual", "location", "contact"] as const;
export type TabValue = typeof TABS[number];

export default function WebsiteBuilderForm() {
    const { isOpen, close, toggle } = useDialog();
    const { session, userId } = useSupabaseSession();
    const { data: projectLimits } = useProjectLimits(userId)
    const router = useRouter()


    const defaultFormData: FormSchema = {
        business_info: {
            name: '',
            description: '',
            offerings: [''],
            location: '',
            images: [{ path: '', description: '' }],
            design_preferences: {
                style: '',
                color_palette: {
                    name: '',
                    theme: '',
                    roles: {
                        background: '',
                        surface: '',
                        text: '',
                        textSecondary: '',
                        primary: '',
                        accent: ''
                    }
                }
            },
            contact_preferences: {
                type: '',
                business_hours: '',
                contact_email: '',
                contact_phone: ''
            },
            branding: {
                logo_url: '',
                logo_file: null,
                tagline: '',
                siteId: ''
            }
        }
    }

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormData
    });

    // All useState hooks
    const [isClient, setIsClient] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
    const [uploadedAssets, setUploadedAssets] = useState<{
        images: { url: string; description: string; metadata: any }[];
        logo?: string;
    }>({
        images: [],
        logo: undefined
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [siteId] = useState(() => {
        return generateSiteId(form.watch('business_info.name') || 'site');
    });
    const [currentTab, setCurrentTab] = useState<TabValue>("basic");

    // All useRef hooks
    const descriptionRef = useRef<HTMLTextAreaElement>(null!);
    const styleRef = useRef<HTMLTextAreaElement>(null!);
    const contactMethodsRef = useRef<HTMLDivElement>(null!);


    // All useEffect hooks
    useEffect(() => {
        setIsClient(true);
        const savedData = localStorage.getItem('websiteBuilder');
        if (savedData) {
            const { formData, currentTab: savedTab } = JSON.parse(savedData);
            form.reset(formData);
            setCurrentTab(savedTab);
        }
    }, [form]);

    useEffect(() => {
        if (isClient) {
            // Save both form data and current tab
            localStorage.setItem('websiteBuilder', JSON.stringify({
                formData: form.getValues(),
                currentTab: currentTab
            }));
        }
    }, [form.watch(), currentTab, isClient, form]); // Watch for form changes and tab changes

    // Loading state
    if (!isClient) {
        return (
            <div className="container mx-auto p-6 space-y-8 max-w-4xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    // Add early return if user has reached their limit
    if (projectLimits && !projectLimits.canCreateMore) {
        return (
            <div className="container mx-auto p-6 space-y-8 max-w-4xl">
                <div className="bg-white p-8 rounded-lg shadow-md text-center space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Website Limit Reached</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>You&apos;ve reached the maximum number of websites you can create.</p>
                        <p>To create a new website, you can delete existing ones from your profile.</p>
                    </div>
                    <Button
                        onClick={() => router.push(`/${userId}`)}
                        className="mt-4"
                    >
                        Go to Profile
                    </Button>
                </div>
            </div>
        );
    }

    // Function to check if current tab is valid
    const isCurrentTabValid = () => {
        const values = form.getValues();
        switch (currentTab) {
            case "basic":
                return !!values.business_info.name &&
                    !!values.business_info.description;
            case "offerings":
                return values.business_info.offerings.length > 0 &&
                    values.business_info.offerings.every(o => !!o);
            case "visual":
                return !!values.business_info.design_preferences.color_palette;
            case "contact":
                const type = values.business_info.contact_preferences.type;
                if (!type) return false;

                if (["form", "email", "subscribe"].includes(type)) {
                    return !!values.business_info.contact_preferences.contact_email;
                }
                if (type === "phone") {
                    return !!values.business_info.contact_preferences.contact_phone;
                }
                return false;
            default:
                return true;
        }
    };

    // Function to move to next tab
    const moveToNextTab = () => {
        const currentIndex = TABS.indexOf(currentTab);
        if (currentIndex < TABS.length - 1) {
            setCurrentTab(TABS[currentIndex + 1]);
        }
    };

    // Check if all required fields are filled
    const isFormComplete = () => {
        const values = form.getValues();
        return !!(
            values.business_info.name &&
            values.business_info.description &&
            values.business_info.offerings.length > 0 &&
            values.business_info.offerings.every(o => !!o) &&
            values.business_info.design_preferences.color_palette.name &&
            values.business_info.contact_preferences.type
            && ((["form", "email", "subscribe"].includes(values.business_info.contact_preferences.type)
                && !!values.business_info.contact_preferences.contact_email)
                || (values.business_info.contact_preferences.type === "phone"
                    && !!values.business_info.contact_preferences.contact_phone))
        );
    };

    // Handle Save & Continue
    const handleSaveAndContinue = () => {
        if (isCurrentTabValid()) {
            moveToNextTab();
        }
    };

    // Handle form submission
    const onSubmit = async (data: FormSchema) => {
        try {
            if (!session) {
                router.push('/auth/sign-in?returnUrl=questionnaire');
                return;
            }

            setIsGenerating(true);

            const response = await fetch('/api/generate-site', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
                },
                body: JSON.stringify({
                    userId,
                    ...data.business_info,
                    images: uploadedAssets.images.map(img => ({
                        url: img.url,
                        description: img.description,
                        metadata: img.metadata
                    })),
                    branding: {
                        ...data.business_info.branding,
                        logo_url: uploadedAssets.logo || data.business_info.branding.logo_url
                    }
                })
            });
            localStorage.removeItem('websiteBuilder');
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to generate site');
            }

            // router.push(`/configure_domain?siteId=${responseData.site_id}&previewUrl=${encodeURIComponent(responseData.preview_url)}`);
            router.push(`/${userId}`);
        } catch (error) {
            console.error('Error in form submission:', error);
            setSubmitStatus({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generate site'
            });
            setIsGenerating(false);
        }
    };

    const handleRevertChanges = () => {
        toggle();
    };

    return (
        <>
            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-lg">Generating your website...</p>
                        <p className="text-sm text-gray-500 mt-2">This may take a minute, please don&apos;t refresh the page.</p>
                    </div>
                </div>
            )}

            <form
                className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-5xl"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <h1 className="text-3xl font-bold mb-4 text-blue-600">Build Site</h1>
                <div className="mb-6">
                    <p className="text-gray-600">
                        To generate your website, please complete all required fields across the following sections:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                        <li>Basic Information - Business name and description</li>
                        <li>Offerings - Your products or services</li>
                        <li>Visual Elements - At least one image and branding details</li>
                        <li>Location - Your business address</li>
                        <li>Contact Information - How customers can reach you</li>
                    </ul>
                    <p className="mt-4 text-sm text-gray-500">
                        Your progress is automatically saved. You can return to complete the form at any time.
                    </p>
                </div>

                <FormProgressTracker
                    form={form}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />

                <WebsiteBuilderContent
                    form={form}
                    uploadedAssets={uploadedAssets}
                    setUploadedAssets={setUploadedAssets}
                    siteId={siteId}
                    descriptionRef={descriptionRef}
                    styleRef={styleRef}
                    contactMethodsRef={contactMethodsRef}
                    currentTab={currentTab}
                />

                <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                        type="button"
                        onClick={handleRevertChanges}
                        variant="outline"
                        className="mb-2 sm:mb-0"
                    >
                        Reset Form
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={handleSaveAndContinue}
                            type="button"
                            disabled={!isCurrentTabValid()}
                            className="w-full sm:w-auto"
                        >
                            Save & Continue
                        </Button>
                        {isFormComplete() ? (
                            <Button
                                type="submit"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const formData = form.getValues();
                                    await onSubmit(formData);
                                }}
                                className="w-full sm:w-auto"
                            >
                                Generate Site
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                disabled
                                className="cursor-not-allowed w-full sm:w-auto"
                            >
                                Complete Required Fields
                            </Button>
                        )}
                    </div>
                </div>

                {/* Success/Error Message */}
                {submitStatus.message && (
                    <Alert className={`mt-4 ${submitStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <AlertDescription className={submitStatus.success ? 'text-green-800' : 'text-red-800'}>
                            {submitStatus.message}
                        </AlertDescription>
                    </Alert>
                )}
            </form>

            <CustomDialog
                isOpen={isOpen}
                onClose={close}
                title="Reset Form"
                continueText="Yes, Reset Form"
                onContinue={() => {
                    form.reset(defaultFormData);
                    setCurrentTab("basic");
                    localStorage.removeItem('websiteBuilder');
                    close();
                }}
            >
                <p>Are you sure you want to revert all changes? This action cannot be undone.</p>
            </CustomDialog>

        </>
    );
}
