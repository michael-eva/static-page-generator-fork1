'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebsites } from '@/hooks/useWebsites';
import { use } from 'react';
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels"
import { GripVertical } from "lucide-react"
import { useState } from "react"

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

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading website</div>;

    const website = websites?.find((website) => website.id === projectId);
    if (!website) return <div>Website not found</div>;

    const deploymentStatus = 'completed'

    return (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-4">Edit Project</h1>

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
                        <CardHeader>
                            <CardTitle>Site Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            {deploymentStatus === 'completed' ? (
                                <div className="h-full w-full border rounded-lg overflow-hidden">
                                    <iframe
                                        src={website.project_url}
                                        className="w-full h-full"
                                        title="Website Preview"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center">
                                    <p>Loading preview...</p>
                                </div>
                            )}
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
                                <div className="flex-1 overflow-y-auto mb-4">
                                    {/* Chat messages will go here */}
                                </div>
                                <div className="border-t pt-4">
                                    {/* Chat input will go here */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Panel>
            </PanelGroup>
        </div>
    )
} 
