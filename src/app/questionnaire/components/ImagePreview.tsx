import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface ImagePreviewProps {
    image: {
        path: string;
        description: string;
        file?: File | null;
    };
    index: number;
    onRemove: (index: number) => void;
    onDescriptionChange: (index: number, description: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, index, onRemove, onDescriptionChange }) => {
    const [objectUrl, setObjectUrl] = useState<string>('');

    useEffect(() => {
        if (image.file instanceof File) {
            const url = URL.createObjectURL(image.file);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [image.file]);

    const imageSrc = image.file instanceof File ? objectUrl : (image.path || null);
    if (!imageSrc) return null;

    return (
        <div className="p-4 border rounded-lg">
            <div className="relative w-full h-48 mb-4">
                <Image
                    src={imageSrc}
                    alt={image.description || `Image ${index + 1}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-md"
                />
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => onRemove(index)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <Input
                type="text"
                value={image.description}
                onChange={(e) => onDescriptionChange(index, e.target.value)}
                placeholder="Image description"
                className="w-full"
            />
        </div>
    );
};

export default ImagePreview; 