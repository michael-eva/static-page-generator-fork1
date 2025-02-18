'use client'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormLabel } from '@/components/ui/form-label';
import React, { useState, useEffect, useRef } from 'react';
import colorPalettes from '@/data/color-palettes.json';
import { useSelectedCard } from '@/context/SelectedCardContext';
import ContactCard from './components/ContactCard';
import ImageUpload from './components/ImageUpload';
import { X } from 'lucide-react';
import Image from 'next/image';
import ImagePreview from './components/ImagePreview';

interface ColorPalette {
    name: string;
    colors: string[];
}

type ContactType = 'form' | 'email' | 'phone' | 'subscribe' | '';

interface FormData {
    business_info: {
        name: string | undefined;
        description: string | undefined;
        offerings: string[];
        location: string;
        images: {
            path: string;
            description: string;
            file?: File | null;
        }[];
        design_preferences: {
            style: string | undefined;
            color_palette: string | undefined;
        };
        contact_preferences: {
            type: ContactType;
            business_hours: string;
            contact_email: string;
            contact_phone: string;
        };
        branding: {
            logo_url: string | undefined;
            default_logo_url?: string;
            logo_file?: {
                file: File | null;
                name: string;
                type: string;
                size: number;
                lastModified: number;
                uploadedAt: string;
            } | null;
            tagline: string | undefined;
        };
    };
}

const BusinessForm = () => {
    const { selectedCard, isLoading } = useSelectedCard();

    const defaultFormData: FormData = {
        business_info: {
            name: selectedCard?.name,
            description: selectedCard?.description,
            offerings: selectedCard?.offering ?? [''],
            location: '',
            images: selectedCard?.images ?? [{ path: '', description: '' }],
            design_preferences: {
                style: selectedCard?.style,
                color_palette: selectedCard?.colorPalette
            },
            contact_preferences: {
                type: '',
                business_hours: '',
                contact_email: '',
                contact_phone: ''
            },
            branding: {
                logo_url: selectedCard?.logoUrl,
                logo_file: null,
                tagline: selectedCard?.tagline
            }
        }
    };

    // All useState hooks
    const [formData, setFormData] = useState<FormData>(defaultFormData);
    const [isClient, setIsClient] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
    const [contactMethodError, setContactMethodError] = useState<string>('');

    // All useRef hooks
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const styleRef = useRef<HTMLTextAreaElement | null>(null);
    const contactMethodsRef = useRef<HTMLDivElement>(null);

    const adjustTextareaHeight = () => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = 'auto';
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    };

    const adjustStyleTextareaHeight = () => {
        if (styleRef.current) {
            styleRef.current.style.height = 'auto';
            styleRef.current.style.height = `${styleRef.current.scrollHeight}px`;
        }
    };

    // All useEffect hooks
    useEffect(() => {
        setIsClient(true);
        const savedData = localStorage.getItem('formData');
        if (savedData) {
            setFormData(JSON.parse(savedData));
        }
    }, []);

    useEffect(() => {
        if (isClient) {
            localStorage.setItem('formData', JSON.stringify(formData));
        }
    }, [formData, isClient]);

    useEffect(() => {
        adjustTextareaHeight();
    }, [formData.business_info.description]);

    useEffect(() => {
        adjustStyleTextareaHeight();
    }, [formData.business_info.design_preferences.style]);

    // Loading state
    if (isLoading || !isClient) {
        return (
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    // Handle adding new offering
    const addOffering = () => {
        setFormData(prev => ({
            ...prev,
            business_info: {
                ...prev.business_info,
                offerings: [...prev.business_info.offerings, '']
            }
        }));
    };

    // Handle color palette selection
    const handlePaletteSelection = (palette: ColorPalette) => {
        setFormData(prev => ({
            ...prev,
            business_info: {
                ...prev.business_info,
                design_preferences: {
                    ...prev.business_info.design_preferences,
                    color_palette: palette.name
                }
            }
        }));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Check if a contact method is selected
        if (!formData.business_info.contact_preferences.type) {
            setContactMethodError('Please select a contact method');
            setSubmitStatus({ success: false, message: 'Please select a contact method before submitting.' });

            // Scroll to the contact methods section
            contactMethodsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            return;
        }

        console.log('Form data:', formData);
        setContactMethodError('');
        setSubmitStatus({ success: true, message: 'Form submitted successfully!' });
    };

    const handleRevertChanges = () => {
        setFormData(defaultFormData);
        localStorage.removeItem('formData');
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Basic Information</h2>

                <div>
                    <FormLabel
                        htmlFor="business-name"
                        description="This is the name of your business. Enter it the way you want it to appear on your website."
                    >
                        Business Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <Input
                        id="business-name"
                        type="text"
                        value={formData.business_info.name}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: { ...prev.business_info, name: e.target.value }
                        }))}
                        className="w-full"
                        required
                    />
                </div>

                <div>
                    <FormLabel
                        htmlFor="business-description"
                        description="This is a description of your business. It will be used to help us understand your business and create a website that is tailored to your needs. Enter as much detail as you can, this will help us create a better website for you."
                    >
                        Description <span className="text-red-500">*</span>
                    </FormLabel>
                    <Textarea
                        id="business-description"
                        value={formData.business_info.description}
                        onChange={(e) => {
                            setFormData(prev => ({
                                ...prev,
                                business_info: { ...prev.business_info, description: e.target.value }
                            }));
                            adjustTextareaHeight();
                        }}
                        ref={descriptionRef}
                        className="w-full"
                        required
                    />
                </div>
            </div>

            {/* Offerings */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Offerings</h2>
                <p className="text-gray-600 mb-4">Enter the offerings of your business. This will be used to help us understand your business and create a website that is tailored to your needs. Enter as much detail as you can, this will help us create a better website for you.</p>
                <FormLabel
                    htmlFor="offerings"
                    description="List your products or services. Each offering should include a name and description."
                >
                    Offerings <span className="text-red-500">*</span>
                </FormLabel>
                {formData.business_info.offerings.map((offering, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            type="text"
                            value={offering}
                            onChange={(e) => {
                                const newOfferings = [...formData.business_info.offerings];
                                newOfferings[index] = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    business_info: { ...prev.business_info, offerings: newOfferings }
                                }));
                            }}
                            className="flex-1"
                            placeholder="Enter offering"
                            required
                        />
                        {index > 0 && (
                            <Button
                                type="button"
                                onClick={() => {
                                    const newOfferings = formData.business_info.offerings.filter((_, i) => i !== index);
                                    setFormData(prev => ({
                                        ...prev,
                                        business_info: { ...prev.business_info, offerings: newOfferings }
                                    }));
                                }}
                                className="bg-red-500 text-white"
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                ))}
                <Button
                    type="button"
                    onClick={addOffering}
                    className="bg-blue-500 text-white"
                >
                    Add Another Offering +
                </Button>
            </div>

            {/* Location */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <p className="text-gray-600 mb-4">Enter the location of your business. Leave blank if you don&apos;t want to display a location on your website.</p>
                <Input
                    type="text"
                    value={formData.business_info.location}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        business_info: { ...prev.business_info, location: e.target.value }
                    }))}
                    className="w-full"
                />
            </div>

            {/* Images */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Images</h2>
                <p className="text-gray-600 mb-4">Upload images that showcase your business. You can drag and drop multiple images at once or select them individually.</p>
                <div className="p-4 border rounded-lg">
                    <ImageUpload
                        value={null}
                        onChange={(file) => {
                            if (file) {
                                setFormData(prev => ({
                                    ...prev,
                                    business_info: {
                                        ...prev.business_info,
                                        images: [{
                                            path: '',
                                            file,
                                            description: ''
                                        }, ...prev.business_info.images]
                                    }
                                }));
                            }
                        }}
                        multiple={true}
                        onMultipleFiles={(files) => {
                            const newImages = files.map(file => ({
                                path: '',
                                file,
                                description: ''
                            }));
                            setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    images: [...newImages, ...prev.business_info.images]
                                }
                            }));
                        }}
                    />
                </div>

                {/* Image Preview List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.business_info.images
                        .filter(image => (image.path && image.path !== '') || (image.file instanceof File))
                        .map((image, index) => (
                            <ImagePreview
                                key={`image-${index}`}
                                image={image}
                                index={index}
                                onRemove={(index) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        business_info: {
                                            ...prev.business_info,
                                            images: prev.business_info.images.filter((_, i) => i !== index)
                                        }
                                    }));
                                }}
                                onDescriptionChange={(index, description) => {
                                    const newImages = [...formData.business_info.images];
                                    newImages[index] = { ...newImages[index], description };
                                    setFormData(prev => ({
                                        ...prev,
                                        business_info: { ...prev.business_info, images: newImages }
                                    }));
                                }}
                            />
                        ))}
                </div>
            </div>

            {/* Design Preferences */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Design Preferences</h2>
                <div>
                    <FormLabel
                        htmlFor="color-palette"
                        description="Choose a color palette that best represents your brand. This will be used as a base for your website&apos;s design."
                    >
                        Color Palette
                    </FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {colorPalettes.map((palette) => (
                            <div
                                key={palette.name}
                                onClick={() => handlePaletteSelection(palette)}
                                className={`cursor-pointer p-2 border-2 rounded-lg ${formData.business_info.design_preferences.color_palette === palette.name ? 'border-blue-500' : 'border-transparent'
                                    }`}
                            >
                                <div className="flex space-x-2">
                                    {palette.colors.map((color, index) => (
                                        <div
                                            key={index}
                                            style={{ backgroundColor: color }}
                                            className="w-8 h-8 rounded-full border"
                                        />
                                    ))}
                                </div>
                                <div className="text-center mt-2">{palette.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <FormLabel
                        htmlFor="style-requirements"
                        description="Enter any other style requirements or preferences for your website design that weren&apos;t covered by the color palette selection."
                    >
                        Style
                    </FormLabel>
                    <Textarea
                        id="style-requirements"
                        value={formData.business_info.design_preferences.style}
                        onChange={(e) => {
                            setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    design_preferences: {
                                        ...prev.business_info.design_preferences,
                                        style: e.target.value
                                    }
                                }
                            }));
                            adjustStyleTextareaHeight();
                        }}
                        ref={styleRef}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Contact Preferences */}
            <div ref={contactMethodsRef} className="space-y-4">
                <h2 className="text-2xl font-bold">Contact Preferences</h2>
                <p className="text-gray-600 mb-6">
                    Choose how your customers will get in touch with you. This will be your main call-to-action section,
                    and its styling will automatically adapt to match your selected template and color palette. Select one
                    of the following contact methods that best suits your business&apos;s needs.
                </p>
                <FormLabel
                    htmlFor="contact-methods"
                    description="Choose how you want your customers to get in touch with you."
                >
                    Contact Methods <span className="text-red-500">*</span>
                </FormLabel>
                {contactMethodError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{contactMethodError}</AlertDescription>
                    </Alert>
                )}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                    <div className="w-[calc(100%-1.5rem)] max-w-[350px] lg:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-1.5rem)] 2xl:w-[calc(25%-1.5rem)]">
                        <ContactCard
                            type="form"
                            selected={formData.business_info.contact_preferences.type === 'form'}
                            onSelect={() => setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    contact_preferences: {
                                        ...prev.business_info.contact_preferences,
                                        type: 'form'
                                    }
                                }
                            }))}
                        />
                    </div>
                    <div className="w-[calc(100%-1.5rem)] max-w-[350px] lg:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-1.5rem)] 2xl:w-[calc(25%-1.5rem)]">
                        <ContactCard
                            type="subscribe"
                            selected={formData.business_info.contact_preferences.type === 'subscribe'}
                            onSelect={() => setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    contact_preferences: {
                                        ...prev.business_info.contact_preferences,
                                        type: 'subscribe'
                                    }
                                }
                            }))}
                        />
                    </div>
                    <div className="w-[calc(100%-1.5rem)] max-w-[350px] lg:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-1.5rem)] 2xl:w-[calc(25%-1.5rem)]">
                        <ContactCard
                            type="email"
                            selected={formData.business_info.contact_preferences.type === 'email'}
                            onSelect={() => setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    contact_preferences: {
                                        ...prev.business_info.contact_preferences,
                                        type: 'email'
                                    }
                                }
                            }))}
                        />
                    </div>
                    <div className="w-[calc(100%-1.5rem)] max-w-[350px] lg:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-1.5rem)] 2xl:w-[calc(25%-1.5rem)]">
                        <ContactCard
                            type="phone"
                            selected={formData.business_info.contact_preferences.type === 'phone'}
                            onSelect={() => setFormData(prev => ({
                                ...prev,
                                business_info: {
                                    ...prev.business_info,
                                    contact_preferences: {
                                        ...prev.business_info.contact_preferences,
                                        type: 'phone'
                                    }
                                }
                            }))}
                        />
                    </div>
                </div>

                <div>
                    <FormLabel
                        htmlFor="business-hours"
                        description="Enter the business hours of your business. Leave blank if you don&apos;t want to display business hours on your website."
                    >
                        Business Hours
                    </FormLabel>
                    <Input
                        type="text"
                        value={formData.business_info.contact_preferences.business_hours}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                contact_preferences: {
                                    ...prev.business_info.contact_preferences,
                                    business_hours: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                    />
                </div>

                <div>
                    <FormLabel
                        htmlFor="contact-email"
                        description="Enter your contact email. This will be used to send you messages from your customers."
                    >
                        Contact Email
                    </FormLabel>
                    <Input
                        type="email"
                        value={formData.business_info.contact_preferences.contact_email}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                contact_preferences: {
                                    ...prev.business_info.contact_preferences,
                                    contact_email: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                        required={formData.business_info.contact_preferences.type === 'email' || formData.business_info.contact_preferences.type === 'form'}
                    />
                </div>
                <div>
                    <FormLabel
                        htmlFor="contact-phone"
                        description="Enter your contact phone number. This will be used to send you messages from your customers."
                    >
                        Contact Phone Number
                    </FormLabel>
                    <Input
                        type="tel"
                        value={formData.business_info.contact_preferences.contact_phone}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                contact_preferences: {
                                    ...prev.business_info.contact_preferences,
                                    contact_phone: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                        required={formData.business_info.contact_preferences.type === 'phone'}
                    />
                </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Branding</h2>
                <div>
                    <FormLabel
                        htmlFor="logo"
                        description="Upload a logo for your business. This will be used to display on your website as well as your favicon."
                    >
                        Logo <span className="text-red-500">*</span>
                    </FormLabel>
                    {(formData.business_info.branding.logo_url || (formData.business_info.branding.logo_file?.file instanceof File)) ? (
                        <div className="my-4 p-4 border rounded-lg">
                            <div className="relative w-full h-48">
                                {(() => {
                                    const logoFile = formData.business_info.branding.logo_file?.file;
                                    const logoSrc = logoFile instanceof File
                                        ? URL.createObjectURL(logoFile)
                                        : (formData.business_info.branding.logo_url || null);

                                    if (!logoSrc) return null;

                                    return (
                                        <Image
                                            src={logoSrc}
                                            alt={formData.business_info.branding.logo_file ? "Uploaded logo" : "Template logo"}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            className="rounded-md"
                                        />
                                    );
                                })()}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            business_info: {
                                                ...prev.business_info,
                                                branding: {
                                                    ...prev.business_info.branding,
                                                    logo_url: prev.business_info.branding.default_logo_url || '',
                                                    logo_file: null
                                                }
                                            }
                                        }));
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {formData.business_info.branding.logo_file
                                        ? `Custom logo: ${formData.business_info.branding.logo_file.name}`
                                        : "Default template logo"}
                                </p>
                                {formData.business_info.branding.logo_file && (
                                    <p className="text-xs text-gray-500">
                                        {Math.round(formData.business_info.branding.logo_file.size / 1024)}KB
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <ImageUpload
                            value={null}
                            onChange={(file) => {
                                if (file instanceof File) {
                                    setFormData(prev => ({
                                        ...prev,
                                        business_info: {
                                            ...prev.business_info,
                                            branding: {
                                                ...prev.business_info.branding,
                                                default_logo_url: prev.business_info.branding.logo_url,
                                                logo_url: '',
                                                logo_file: {
                                                    file,
                                                    name: file.name,
                                                    type: file.type,
                                                    size: file.size,
                                                    lastModified: file.lastModified,
                                                    uploadedAt: new Date().toISOString()
                                                }
                                            }
                                        }
                                    }));
                                }
                            }}
                        />
                    )}
                </div>

                <div>
                    <FormLabel
                        htmlFor="tagline"
                        description="Enter a tagline for your business."
                    >
                        Tagline
                    </FormLabel>
                    <Input
                        type="text"
                        value={formData.business_info.branding.tagline}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                branding: {
                                    ...prev.business_info.branding,
                                    tagline: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Submit and Revert Buttons */}
            <div className="flex justify-between">
                <Button
                    type="submit"
                    className="bg-green-500 text-white hover:bg-green-600"
                >
                    Submit
                </Button>
                <Button
                    type="button"
                    onClick={handleRevertChanges}
                    className="bg-gray-500 text-white hover:bg-gray-600"
                >
                    Revert Changes
                </Button>
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
    );
};

export default BusinessForm;
