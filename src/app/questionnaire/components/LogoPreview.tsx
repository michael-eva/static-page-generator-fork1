import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface LogoPreviewProps {
    logo: {
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
    };
    onRemove: () => void;
}

const LogoPreview: React.FC<LogoPreviewProps> = ({ logo, onRemove }) => {
    const [objectUrl, setObjectUrl] = useState<string>('');

    useEffect(() => {
        if (logo.logo_file?.file instanceof File) {
            const url = URL.createObjectURL(logo.logo_file.file);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [logo.logo_file?.file]);

    const logoFile = logo.logo_file?.file;
    const logoSrc = logoFile instanceof File ? objectUrl : (logo.logo_url || null);
    if (!logoSrc) return null;

    return (
        <div className="my-4 p-4 border rounded-lg">
            <div className="relative w-full h-48">
                <Image
                    src={logoSrc}
                    alt={logo.logo_file ? "Uploaded logo" : "Template logo"}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-md"
                />
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    {logo.logo_file
                        ? `Custom logo: ${logo.logo_file.name}`
                        : "Default template logo"}
                </p>
                {logo.logo_file && (
                    <p className="text-xs text-gray-500">
                        {Math.round(logo.logo_file.size / 1024)}KB
                    </p>
                )}
            </div>
        </div>
    );
};

export default LogoPreview; 