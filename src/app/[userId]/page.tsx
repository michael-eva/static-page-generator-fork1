'use client'
import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { use } from 'react'
import { useQueryClient } from "@tanstack/react-query"
import { useState } from 'react'
import { useProjectLimits } from "@/hooks/useProjectLimits"
import { toast } from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWebsites } from "@/hooks/useWebsites"

interface DashboardProps {
    params: Promise<{ userId: string }>;
}

export default function Dashboard({ params }: DashboardProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const resolvedParams = use(params)
    const { data: projectLimits } = useProjectLimits(resolvedParams.userId)

    const handleCreateNewProject = () => {
        if (!projectLimits?.canCreateMore) {
            toast.error("Project limit reached. Please upgrade your plan.")
            return
        }
        router.push('/template')
    }
    const { data: websites } = useWebsites(resolvedParams.userId);
    async function handleDeleteProject(siteId: string) {
        try {
            setDeletingId(siteId)
            const response = await fetch('/api/delete-site', {
                method: 'POST',
                body: JSON.stringify({ siteId: siteId })
            })
            if (response.ok) {
                await queryClient.invalidateQueries({ queryKey: ["websites", resolvedParams.userId] });
                toast.success('Project deleted successfully')
            } else {
                toast.error('Failed to delete project')
            }
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="min-h-screen w-full bg-muted/40 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">My Projects</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-muted-foreground">
                                {projectLimits?.currentCount} / {projectLimits?.limit} projects used
                            </p>
                            <Button
                                onClick={handleCreateNewProject}
                                disabled={!projectLimits?.canCreateMore}
                            >
                                Create New Project
                            </Button>
                        </div>
                    </div>
                    {!projectLimits?.canCreateMore && (
                        <p className="mt-2 text-sm text-yellow-600">
                            You've reached your project limit. Upgrade your plan to create more projects.
                        </p>
                    )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {websites?.map((project) => (
                        <Card
                            key={project.id}
                            className="overflow-hidden cursor-pointer"
                            onClick={(e) => {
                                // Only navigate if the click target is the card or its non-dropdown children
                                if (!e.defaultPrevented) {
                                    router.push(`/${resolvedParams.userId}/edit/${project.id}`)
                                }
                            }}
                        >
                            <div className="aspect-video relative">
                                <Image
                                    src={project.preview_url || "/placeholder.svg"}
                                    alt={project.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>View Project</DropdownMenuItem>
                                        <DropdownMenuItem>View Deployment</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-500"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteProject(project.site_id);
                                            }}
                                            disabled={deletingId === project.site_id}
                                        >
                                            {deletingId === project.site_id ? 'Deleting...' : 'Delete Project'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Badge variant={project.hosting_status === "Live" ? "default" : "secondary"} className="rounded-md">
                                        {project.hosting_status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">Updated {project.updated_at}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <a
                                    href={project.project_url}
                                    className="text-sm text-muted-foreground hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {project.project_url}
                                </a>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

