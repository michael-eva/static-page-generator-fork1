'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebsites } from '@/hooks/useWebsites';
import { use } from 'react';
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels"
import { GripVertical, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface PageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

export default function ProjectEditPage({ params }: PageProps) {
    const { projectId, userId } = use(params)
    const { data: websites, isLoading, error } = useWebsites(userId);
    const [isChatMinimized, setIsChatMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [websiteHtml, setWebsiteHtml] = useState<string>('');
    const [previewChanges, setPreviewChanges] = useState<{
        old_html: string;
        new_html: string;
        changes: Array<{old_content: string, new_content: string, description: string}>;
    } | null>(null);

    if (error) return <div>Error loading website</div>;

    const website = websites?.find((website) => website.id === projectId);
    if (!website) return <div>Website not found</div>;

    const fetchWebsiteHtml = async () => {
        try {
            const response = await fetch(`/api/get-website-html?siteId=${website.site_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch website HTML');
            }
            const data = await response.json();
            setWebsiteHtml(data.html);
        } catch (error) {
            console.error('Error fetching website HTML:', error);
            setWebsiteHtml('<div class="error">Failed to load website content</div>');
        }
    };

    if (website) {
        fetchWebsiteHtml();
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoadingEdit) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoadingEdit(true);

        try {
            const response = await fetch('/api/edit-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteId: website.site_id,
                    prompt: userMessage,
                    imageUrl: messages.find(m => m.imageUrl)?.imageUrl
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                setPreviewChanges({
                    old_html: result.old_html,
                    new_html: result.new_html,
                    changes: result.changes || []
                });
                
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'I\'ve generated the changes based on your instructions. Please review them in the preview panel. If you\'re happy with them, click "Deploy Changes" to make them live.' 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `I'm sorry, but I couldn't make the changes: ${result.message || result.error}` 
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'An error occurred while trying to update the website. Please try again.' 
            }]);
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleDeployChanges = async () => {
        if (!previewChanges) return;

        try {
            setIsLoadingEdit(true);
            const response = await fetch('/api/edit-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteId: website.site_id,
                    html: previewChanges.new_html,
                    action: 'deploy'
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                setWebsiteHtml(previewChanges.new_html);
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'Changes deployed successfully! The website has been updated.' 
                }]);
                setPreviewChanges(null);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Failed to deploy changes: ${result.message || result.error}` 
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'An error occurred while deploying changes. Please try again.' 
            }]);
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');
        formData.append('siteId', website.site_id);

        try {
            setIsUploading(true);
            const response = await fetch('/api/upload-asset', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
                }
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { 
                role: 'user', 
                content: `I want to add this image to the website`,
                imageUrl: data.url
            }]);
            
            // Automatically submit the image URL to the edit-html endpoint
            setIsLoadingEdit(true);
            const editResponse = await fetch('/api/edit-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteId: website.site_id,
                    prompt: `Insert this image into the website: ${data.url}`,
                    imageUrl: data.url
                }),
            });

            const editResult = await editResponse.json();
            
            if (editResult.success) {
                setPreviewChanges({
                    old_html: editResult.old_html,
                    new_html: editResult.new_html,
                    changes: editResult.changes || []
                });
                
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: 'I\'ve added the image to the website. Please review the changes in the preview panel. If you\'re happy with them, click "Deploy Changes" to make them live.' 
                }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `I'm sorry, but I couldn't add the image: ${editResult.message || editResult.error}` 
                }]);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Failed to upload image. Please try again.' 
            }]);
        } finally {
            setIsUploading(false);
            setIsLoadingEdit(false);
        }
    };

    if (isLoading) return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" /> {/* Title skeleton */}

            <PanelGroup
                direction="horizontal"
                className="min-h-[calc(100vh-200px)]"
            >
                {/* Preview Panel Skeleton */}
                <Panel
                    defaultSize={75}
                    minSize={50}
                    maxSize={90}
                >
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" /> {/* Card title skeleton */}
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <div className="h-full w-full bg-gray-200 rounded-lg animate-pulse" />
                        </CardContent>
                    </Card>
                </Panel>

                <PanelResizeHandle>
                    <GripVertical className="h-4 w-4" />
                </PanelResizeHandle>

                {/* Chat Panel Skeleton */}
                <Panel
                    defaultSize={25}
                    minSize={10}
                    maxSize={50}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /> {/* Chat title skeleton */}
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </Panel>
            </PanelGroup>
        </div>
    );

    return (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PanelGroup
                direction="horizontal"
                className="min-h-[calc(100vh-200px)]"
            >
                {/* Preview Panel */}
                <Panel
                    defaultSize={75}
                    minSize={50}
                    maxSize={90}
                >
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex gap-2">
                                {previewChanges && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeployChanges}
                                        disabled={isLoadingEdit}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {isLoadingEdit ? 'Deploying...' : 'Deploy Changes'}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <div className="h-full w-full border rounded-lg overflow-hidden">
                                <div 
                                    className="w-full h-full"
                                    style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div 
                                        className="absolute inset-0 overflow-auto"
                                        style={{
                                            transform: 'translate3d(0,0,0)',
                                            willChange: 'transform',
                                        }}
                                    >
                                        <div 
                                            style={{
                                                minHeight: '100%',
                                                backgroundColor: 'white',
                                                position: 'relative',
                                            }}
                                            dangerouslySetInnerHTML={{ 
                                                __html: previewChanges?.new_html || websiteHtml 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Panel>

                {/* Resize Handle */}
                <PanelResizeHandle>
                    <GripVertical className="h-4 w-4" />
                </PanelResizeHandle>

                {/* Chat Panel */}
                <Panel
                    defaultSize={25}
                    minSize={10}
                    maxSize={50}
                    collapsible={true}
                    collapsedSize={5}
                    onCollapse={() => setIsChatMinimized(true)}
                    onExpand={() => setIsChatMinimized(false)}
                >
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={isChatMinimized ? "hidden" : ""}>AI Chat</CardTitle>
                        </CardHeader>
                        <CardContent className={isChatMinimized ? "hidden" : ""}>
                            <div className="flex flex-col h-[calc(100vh-300px)]">
                                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start gap-3 p-4 rounded-lg",
                                                message.role === 'user'
                                                    ? 'bg-blue-50 ml-auto max-w-[80%]'
                                                    : 'bg-gray-50 mr-auto max-w-[80%]'
                                            )}
                                        >
                                            {message.role === 'assistant' && (
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                {message.imageUrl ? (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <ImageIcon className="w-4 h-4" />
                                                        <a 
                                                            href={message.imageUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="hover:underline"
                                                        >
                                                            View Image
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-800">{message.content}</p>
                                                )}
                                            </div>
                                            {message.role === 'user' && (
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoadingEdit && (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="border-t pt-4">
                                    <form onSubmit={handleSubmit} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Type your instructions here..."
                                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isLoadingEdit || isUploading}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="image-upload"
                                                disabled={isLoadingEdit || isUploading}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 hover:bg-blue-50"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                ) : (
                                                    <Upload className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <button
                                                type="submit"
                                                disabled={isLoadingEdit || isUploading}
                                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Panel>
            </PanelGroup>
        </div>
    )
} 
