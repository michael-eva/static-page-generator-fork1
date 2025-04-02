import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormLabel } from '@/components/ui/form-label'
import { PlusCircle, X } from "lucide-react"
import React, { RefObject } from 'react'
import Image from 'next/image'
import ImageUpload from './ImageUpload'
import ImagePreview from './ImagePreview'
import colorPalettes from '@/data/color-palettes.json'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UseFormReturn } from "react-hook-form"
import { FormSchema, TabValue } from "../page"
import ContactCard from "./ContactCard"

interface WebsiteBuilderContentProps {
  form: UseFormReturn<FormSchema>;
  uploadedAssets: {
    images: { url: string; description: string; metadata: any }[];
    logo?: string;
  };
  setUploadedAssets: React.Dispatch<React.SetStateAction<{
    images: { url: string; description: string; metadata: any }[];
    logo?: string;
  }>>;
  siteId: string;
  descriptionRef: RefObject<HTMLTextAreaElement>;
  styleRef: RefObject<HTMLTextAreaElement>;
  contactMethodsRef: RefObject<HTMLDivElement>;
  currentTab: TabValue;
}

export function WebsiteBuilderContent({
  form,
  setUploadedAssets,
  siteId,
  descriptionRef,
  styleRef,
  contactMethodsRef,
  currentTab,
}: WebsiteBuilderContentProps) {
  const renderContent = () => {
    switch (currentTab) {
      case "basic":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
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
                  value={form.watch('business_info.name') || ''}
                  onChange={(e) => form.setValue('business_info.name', e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="tagline"
                  description="A short, catchy phrase that represents your business"
                >
                  Tagline <span className="text-red-500">*</span>
                </FormLabel>
                <Input
                  id="tagline"
                  type="text"
                  value={form.watch('business_info.branding.tagline') || ''}
                  onChange={(e) => form.setValue('business_info.branding.tagline', e.target.value)}
                  placeholder="A short, catchy phrase that represents your business"
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="description"
                  description="This is a description of your business. It will be used to help us understand your business and create a website that is tailored to your needs."
                >
                  Description <span className="text-red-500">*</span>
                </FormLabel>
                <Textarea
                  id="description"
                  value={form.watch('business_info.description') || ''}
                  onChange={(e) => form.setValue('business_info.description', e.target.value)}
                  ref={descriptionRef}
                  placeholder="Describe your business in detail"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="logo"
                  description="Upload a logo for your business. This will be used to display on your website as well as your favicon."
                >
                  Logo <span className="text-red-500">*</span>
                </FormLabel>

                {(form.watch('business_info.branding.logo_url') || (form.watch('business_info.branding.logo_file.file') instanceof File)) ? (
                  <div className="border-2 border-dashed rounded-md p-6 mt-2">
                    <div className="relative w-full h-48">
                      {(() => {
                        const logoFile = form.watch('business_info.branding.logo_file.file');
                        const logoSrc = logoFile instanceof File
                          ? URL.createObjectURL(logoFile)
                          : (form.watch('business_info.branding.logo_url') || null);

                        if (!logoSrc) return null;

                        return (
                          <Image
                            src={logoSrc}
                            alt={form.watch('business_info.branding.logo_file.name') || "Template logo"}
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
                          form.setValue('business_info.branding.logo_url', form.getValues('business_info.branding.default_logo_url') || '');
                          form.setValue('business_info.branding.logo_file', null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {form.watch('business_info.branding.logo_file.name')
                          ? `Custom logo: ${form.watch('business_info.branding.logo_file.name')}`
                          : "Default template logo"}
                      </p>
                      {form.watch('business_info.branding.logo_file.file') && (
                        <p className="text-xs text-gray-500">
                          {Math.round((form.watch('business_info.branding.logo_file.file') as File).size / 1024)}KB
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-6 mt-2 text-center">
                    <ImageUpload
                      value={null}
                      onChange={(file) => {
                        if (file instanceof File) {
                          form.setValue('business_info.branding.logo_file', {
                            file,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified,
                            uploadedAt: new Date().toISOString()
                          });
                        }
                      }}
                      type="logo"
                      onUploadComplete={(url) => {
                        setUploadedAssets(prev => ({
                          ...prev,
                          logo: url
                        }));
                      }}
                      siteId={siteId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "offerings":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Offerings/Services</h2>

            <div className="space-y-4">
              <FormLabel
                htmlFor="offerings"
                description="List your products or services. Each offering should include a name and description."
              >
                Offerings <span className="text-red-500">*</span>
              </FormLabel>
              {form.watch('business_info.offerings').map((offering: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={offering}
                    onChange={(e) => form.setValue(`business_info.offerings.${index}`, e.target.value)}
                    placeholder={`Offering ${index + 1}`}
                    required
                  />
                  {form.watch('business_info.offerings').length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const currentOfferings = form.watch('business_info.offerings');
                        const newOfferings = currentOfferings.filter((_, i) => i !== index);
                        form.setValue('business_info.offerings', newOfferings);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => form.setValue('business_info.offerings', [...form.watch('business_info.offerings'), ''])}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Another Offering
              </Button>
            </div>
          </div>
        );

      case "visual":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Visual Style</h2>

            <div className="space-y-4">
              <div>
                <FormLabel
                  htmlFor="color-palette"
                  description="Choose a color palette that best represents your brand. This will be used as a base for your website's design."
                >
                  Color Palette <span className="text-red-500">*</span>
                </FormLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {colorPalettes.map((palette: any) => (
                    <div
                      key={palette.name}
                      onClick={() => form.setValue('business_info.design_preferences.color_palette', {
                        name: palette.name,
                        theme: palette.theme,
                        roles: {
                          background: palette.roles.background,
                          surface: palette.roles.surface,
                          text: palette.roles.text,
                          textSecondary: palette.roles.textSecondary,
                          primary: palette.roles.primary,
                          accent: palette.roles.accent,
                        }
                      })}
                      className={`cursor-pointer border rounded-md p-3 hover:border-primary ${form.watch('business_info.design_preferences.color_palette.name') === palette.name
                        ? "border-primary bg-primary/10"
                        : ""
                        }`}
                    >
                      <div className="flex gap-1 mb-2">
                        {Object.entries(palette.roles || {}).map(([role, color]: [string, any]) => (
                          <div
                            key={role}
                            style={{ backgroundColor: color }}
                            className="w-6 h-6 rounded-full"
                            title={role}
                          />
                        ))}
                      </div>
                      <p className="text-sm capitalize">{palette.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FormLabel
                  htmlFor="style"
                  description="Enter any style requirements or preferences for your website design."
                >
                  Style Preferences
                </FormLabel>
                <Textarea
                  id="style"
                  value={form.watch('business_info.design_preferences.style') || ''}
                  onChange={(e) => form.setValue('business_info.design_preferences.style', e.target.value)}
                  ref={styleRef}
                  placeholder="Describe your preferred style (modern, classic, minimalist, etc.)"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="images"
                  description="Upload images that showcase your business. You can upload multiple images."
                >
                  Images
                </FormLabel>
                <div className="border-2 border-dashed rounded-md p-6 mt-2 text-center">
                  <ImageUpload
                    value={null}
                    onChange={(file) => {
                      if (file) {
                        form.setValue('business_info.images', [{
                          path: '',
                          file,
                          description: ''
                        }, ...form.watch('business_info.images')]);
                      }
                    }}
                    multiple={true}
                    onMultipleFiles={(files) => {
                      const newImages = files.map(file => ({
                        path: '',
                        file,
                        description: ''
                      }));
                      form.setValue('business_info.images', [...newImages, ...form.watch('business_info.images')]);
                    }}
                    type="image"
                    onUploadComplete={(url, metadata) => {
                      setUploadedAssets(prev => ({
                        ...prev,
                        images: [...prev.images, { url, description: '', metadata }]
                      }));
                    }}
                    siteId={siteId}
                  />
                </div>

                {/* Image Preview List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                  {form.watch('business_info.images')
                    .filter((image: { path: string; file?: File }) => (image.path && image.path !== '') || (image.file instanceof File))
                    .map((image: { path: string; file?: File; description: string }, index: number) => (
                      <ImagePreview
                        key={`image-${index}`}
                        image={image}
                        index={index}
                        onRemove={(index: number) => {
                          form.setValue('business_info.images', form.watch('business_info.images').filter((_: any, i: number) => i !== index));
                        }}
                        onDescriptionChange={(index: number, description: string) => {
                          const newImages = [...form.watch('business_info.images')];
                          newImages[index] = { ...newImages[index], description };
                          form.setValue('business_info.images', newImages);
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Location & Hours</h2>

            <div className="space-y-4">
              <div>
                <FormLabel
                  htmlFor="location"
                  description="Enter the location of your business. Leave blank if you don't want to display a location on your website."
                >
                  Location
                </FormLabel>
                <Input
                  id="location"
                  placeholder="Enter your business address"
                  value={form.watch('business_info.location')}
                  onChange={(e) => form.setValue('business_info.location', e.target.value)}
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="business-hours"
                  description="Enter the business hours of your business. Leave blank if you don't want to display business hours on your website."
                >
                  Business Hours
                </FormLabel>
                <Input
                  id="business-hours"
                  placeholder="e.g. Mon-Fri: 9AM-5PM, Sat: 10AM-3PM"
                  value={form.watch('business_info.contact_preferences.business_hours')}
                  onChange={(e) => form.setValue('business_info.contact_preferences.business_hours', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6" ref={contactMethodsRef}>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div>
                <FormLabel
                  htmlFor="contact-methods"
                  description="Choose how you want your customers to get in touch with you."
                >
                  Contact Methods <span className="text-red-500">*</span>
                </FormLabel>

                {!form.watch('business_info.contact_preferences.type') && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>You must select at least one contact method.</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  <div className="w-full max-w-[400px]">
                    <ContactCard
                      type="form"
                      selected={form.watch('business_info.contact_preferences.type') === 'form'}
                      onSelect={() => form.setValue('business_info.contact_preferences.type', 'form')}
                    />
                  </div>
                  <div className="w-full max-w-[400px]">
                    <ContactCard
                      type="subscribe"
                      selected={form.watch('business_info.contact_preferences.type') === 'subscribe'}
                      onSelect={() => form.setValue('business_info.contact_preferences.type', 'subscribe')}
                    />
                  </div>
                  <div className="w-full max-w-[400px]">
                    <ContactCard
                      type="email"
                      selected={form.watch('business_info.contact_preferences.type') === 'email'}
                      onSelect={() => form.setValue('business_info.contact_preferences.type', 'email')}
                    />
                  </div>
                  <div className="w-full max-w-[400px]">
                    <ContactCard
                      type="phone"
                      selected={form.watch('business_info.contact_preferences.type') === 'phone'}
                      onSelect={() => form.setValue('business_info.contact_preferences.type', 'phone')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <FormLabel
                  htmlFor="email"
                  description="Enter your contact email. This will be used to send you messages from your customers."
                >
                  Contact Email {(["form", "email", "subscribe"].includes(form.watch('business_info.contact_preferences.type'))) && <span className="text-red-500">*</span>}
                </FormLabel>
                {form.formState.errors.business_info?.contact_preferences?.contact_email && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                      {form.formState.errors.business_info.contact_preferences.contact_email.message}
                    </AlertDescription>
                  </Alert>
                )}
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...form.register('business_info.contact_preferences.contact_email')}
                />
              </div>

              <div>
                <FormLabel
                  htmlFor="phone"
                  description="Enter your contact phone number. This will be displayed on your website."
                >
                  Phone Number {form.watch('business_info.contact_preferences.type') === 'phone' && <span className="text-red-500">*</span>}
                </FormLabel>
                {form.formState.errors.business_info?.contact_preferences?.contact_phone && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                      {form.formState.errors.business_info.contact_preferences.contact_phone.message}
                    </AlertDescription>
                  </Alert>
                )}
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  {...form.register('business_info.contact_preferences.contact_phone')}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white border rounded-lg shadow-sm">
      {renderContent()}
    </div>
  );
}
