'use client'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';
import colorPalettes from '@/data/color-palettes.json';
import { useSelectedCard } from '@/context/SelectedCardContext';
import ContactCard from './components/ContactCard';

const BusinessForm = () => {
    const { selectedCard } = useSelectedCard();
    const [selectedContactType, setSelectedContactType] = useState<'form' | 'email' | 'phone' | null>(null);
    const [formData, setFormData] = useState({
        business_info: {
            name: '',
            description: '',
            offerings: [''],
            location: '',
            images: [{ description: '', image_url: '' }],
            design_preferences: {
                style: '',
                color_palette: selectedCard?.colorPalette
            },
            contact_preferences: {
                type: [],
                business_hours: '',
                contact_email: ''
            },
            branding: {
                logo_url: '',
                tagline: ''
            }
        }
    });

    const [submitStatus, setSubmitStatus] = useState({ success: false, message: '' });
    const [selectedPalette, setSelectedPalette] = useState(
        colorPalettes.find(palette => palette.name === selectedCard?.colorPalette) || colorPalettes[0]
    );

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

    // Handle adding new image
    const addImage = () => {
        setFormData(prev => ({
            ...prev,
            business_info: {
                ...prev.business_info,
                images: [...prev.business_info.images, { description: '', image_url: '' }]
            }
        }));
    };

    // Handle contact type checkbox changes
    const handleContactTypeChange = (type) => {
        setFormData(prev => {
            const currentTypes = prev.business_info.contact_preferences.type;
            const updatedTypes = currentTypes.includes(type)
                ? currentTypes.filter(t => t !== type)
                : [...currentTypes, type];

            return {
                ...prev,
                business_info: {
                    ...prev.business_info,
                    contact_preferences: {
                        ...prev.business_info.contact_preferences,
                        type: updatedTypes
                    }
                }
            };
        });
    };

    // Handle color palette selection
    const handlePaletteSelection = (palette) => {
        setSelectedPalette(palette);
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
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form data:', formData);
        setSubmitStatus({ success: true, message: 'Form submitted successfully!' });
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Basic Information</h2>

                <div>
                    <label className="block text-sm font-medium mb-1">Business Name</label>
                    <Input
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
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                        value={formData.business_info.description}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: { ...prev.business_info, description: e.target.value }
                        }))}
                        className="w-full"
                        required
                    />
                </div>
            </div>

            {/* Offerings */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Offerings</h2>
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
                    Add Offering
                </Button>
            </div>

            {/* Location */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Location</h2>
                <Input
                    type="text"
                    value={formData.business_info.location}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        business_info: { ...prev.business_info, location: e.target.value }
                    }))}
                    className="w-full"
                    required
                />
            </div>

            {/* Images */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Images</h2>
                {formData.business_info.images.map((image, index) => (
                    <div key={index} className="space-y-2">
                        <Input
                            type="text"
                            value={image.image_url}
                            onChange={(e) => {
                                const newImages = [...formData.business_info.images];
                                newImages[index] = { ...image, image_url: e.target.value };
                                setFormData(prev => ({
                                    ...prev,
                                    business_info: { ...prev.business_info, images: newImages }
                                }));
                            }}
                            className="w-full"
                            placeholder="Image URL"
                            required
                        />
                        <Input
                            type="text"
                            value={image.description}
                            onChange={(e) => {
                                const newImages = [...formData.business_info.images];
                                newImages[index] = { ...image, description: e.target.value };
                                setFormData(prev => ({
                                    ...prev,
                                    business_info: { ...prev.business_info, images: newImages }
                                }));
                            }}
                            className="w-full"
                            placeholder="Image description"
                            required
                        />
                    </div>
                ))}
                <Button
                    type="button"
                    onClick={addImage}
                    className="bg-blue-500 text-white"
                >
                    Add Image
                </Button>
            </div>

            {/* Design Preferences */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Design Preferences</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">Style</label>
                    <Input
                        type="text"
                        value={formData.business_info.design_preferences.style}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                design_preferences: {
                                    ...prev.business_info.design_preferences,
                                    style: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Color Palettes</label>
                    <div className="flex flex-wrap gap-4">
                        {colorPalettes.map(palette => (
                            <div
                                key={palette.name}
                                onClick={() => handlePaletteSelection(palette)}
                                className={`cursor-pointer p-2 border-2 rounded-lg ${selectedPalette.name === palette.name ? 'border-blue-500' : 'border-transparent'
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
            </div>

            {/* Contact Preferences */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Contact Preferences</h2>
                <p className="text-gray-600 mb-6">
                    Choose how your customers will get in touch with you. This will be your main call-to-action section,
                    and its styling will automatically adapt to match your selected template and color palette. Select one
                    of the following contact methods that best suits your business needs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ContactCard
                        type="form"
                        selected={selectedContactType === 'form'}
                        onSelect={() => setSelectedContactType('form')}
                    />
                    <ContactCard
                        type="email"
                        selected={selectedContactType === 'email'}
                        onSelect={() => setSelectedContactType('email')}
                    />
                    <ContactCard
                        type="phone"
                        selected={selectedContactType === 'phone'}
                        onSelect={() => setSelectedContactType('phone')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Business Hours</label>
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
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
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
                        required
                    />
                </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Branding</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">Logo URL</label>
                    <Input
                        type="text"
                        value={formData.business_info.branding.logo_url}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            business_info: {
                                ...prev.business_info,
                                branding: {
                                    ...prev.business_info.branding,
                                    logo_url: e.target.value
                                }
                            }
                        }))}
                        className="w-full"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Tagline</label>
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
                        required
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div>
                <Button
                    type="submit"
                    className="w-full bg-green-500 text-white hover:bg-green-600"
                >
                    Submit
                </Button>
            </div>

            {/* Success Message */}
            {submitStatus.success && (
                <Alert className="mt-4">
                    <AlertDescription>{submitStatus.message}</AlertDescription>
                </Alert>
            )}
        </form>
    );
};

export default BusinessForm;
