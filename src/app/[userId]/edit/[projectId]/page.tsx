'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebsites } from '@/hooks/useWebsites';
import { use } from 'react';
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels"
import { GripVertical, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from '@/components/ui/badge';
// import { useState } from "react"

interface PageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

export default function ProjectEditPage({ params }: PageProps) {
    const { projectId, userId } = use(params)
    const { data: websites, isLoading, error } = useWebsites(userId);

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

    if (error) return <div>Error loading website</div>;

    const website = websites?.find((website) => website.site_id === projectId);
    if (!website) return <div>Website not found</div>;


    return (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-4">Edit Project</h1>
            <div className="flex justify-between items-center mb-6">
                {!website.domain_setups[0]?.completed ? <div className="space-x-4">
                    <Button variant="outline" asChild>
                        <Link href={`/${userId}/edit/${projectId}/domain`}>
                            <Globe className="mr-2 h-4 w-4" />
                            Domain Setup
                        </Link>
                    </Button>
                </div> :
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Domain Connected
                        </Badge>
                        <Link href={`https://${website.domain_setups[0].domain_name}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <Globe className="mr-2 h-4 w-4" />
                                Visit {website.domain_setups[0].domain_name}
                            </Button>
                        </Link>
                    </div>
                }
            </div>

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
                {/* <PanelResizeHandle>
                    <GripVertical className="h-4 w-4" />
                </PanelResizeHandle> */}

                {/* Chat Panel */}
                {/* <Panel
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
                                <div className="flex-1 overflow-y-auto mb-4">
                                    
                                </div>
                                <div className="border-t pt-4">

                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Panel> */}
            </PanelGroup>
        </div>
    )
} 
