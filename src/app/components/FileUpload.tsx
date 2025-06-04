import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, FileText, FileImage, Download, Video, Music, Archive, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onUploadComplete: (url: string, fileName: string, fileType: string) => void;
    siteId: string;
    className?: string;
}

// Helper function to get appropriate icon for file type
const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (fileType.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <Archive className="h-6 w-6" />;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadComplete,
    siteId,
    className = ''
}) => {
    const [uploadingFiles, setUploadingFiles] = useState<Map<string, { name: string; progress: number; size: string }>>(new Map());
    const [errors, setErrors] = useState<Map<string, string>>(new Map());

    const uploadFile = async (file: File) => {
        const fileKey = `${file.name}-${file.lastModified}`;
        const fileSize = formatFileSize(file.size);
        
        setUploadingFiles(prev => new Map(prev).set(fileKey, { name: file.name, progress: 0, size: fileSize }));
        setErrors(prev => { const newMap = new Map(prev); newMap.delete(fileKey); return newMap; });
        
        console.log('Starting file upload:', {
            fileName: file.name,
            type: file.type,
            size: file.size
        });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'asset'); // Generic asset type
            formData.append('siteId', siteId);

            const response = await fetch('/api/upload-asset', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Upload response error:', {
                    status: response.status,
                    error: errorData
                });
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload successful:', { url: data.url });
            onUploadComplete(data.url, file.name, file.type);
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setErrors(prev => new Map(prev).set(fileKey, errorMessage));
        } finally {
            setUploadingFiles(prev => {
                const newMap = new Map(prev);
                newMap.delete(fileKey);
                return newMap;
            });
        }
    };

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        // Handle rejected files
        rejectedFiles.forEach(({file, errors}) => {
            const fileKey = `${file.name}-${file.lastModified}`;
            const errorMessage = errors.map((e: any) => e.message).join(', ');
            setErrors(prev => new Map(prev).set(fileKey, errorMessage));
        });

        // Upload accepted files
        acceptedFiles.forEach(file => uploadFile(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 52428800, // 50MB - increased from 5MB for general files
        multiple: false // Single file for chat context
    });

    const clearError = (fileKey: string) => {
        setErrors(prev => { const newMap = new Map(prev); newMap.delete(fileKey); return newMap; });
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <input {...getInputProps()} />
                <div className="space-y-2">
                    <Upload className="mx-auto h-6 w-6 text-gray-400" />
                    <div className="text-sm text-gray-600">
                        {isDragActive ? (
                            "Drop the file here"
                        ) : (
                            <div>
                                <p>Drag & drop a file here, or click to select</p>
                                <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {uploadingFiles.size > 0 && (
                <div className="space-y-2">
                    {Array.from(uploadingFiles.entries()).map(([key, fileInfo]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                            <div className="animate-spin">
                                <Upload className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{fileInfo.name}</div>
                                <div className="text-xs text-gray-500">{fileInfo.size}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {errors.size > 0 && (
                <div className="space-y-2">
                    {Array.from(errors.entries()).map(([key, error]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                                <div className="truncate">{error}</div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearError(key)}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload; 