import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
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

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import Link from "next/link"

type Props = {
    projectId: string
    userId: string
    project: {
        id: string
        name: string
        preview_url: string | null
        site_id: string
        hosting_status: string
        updated_at: string
        project_url: string
    }
}

export default function WebsiteCard(props: Props) {
    const router = useRouter()
    const { project } = props
    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    async function handleDeleteProject(siteId: string) {
        try {
            setDeletingId(siteId)
            const response = await fetch('/api/delete-site', {
                method: 'POST',
                body: JSON.stringify({ siteId: siteId })
            })
            if (response.ok) {
                await queryClient.invalidateQueries({ queryKey: ["websites", props.userId] });
                toast.success('Project deleted successfully')
            } else {
                toast.error('Failed to delete project')
            }
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Card
            key={props.projectId}
            className="overflow-hidden cursor-pointer"
            onClick={(e) => {
                // Only navigate if the click target is the card or its non-dropdown children
                if (!e.defaultPrevented) {
                    router.push(`/${props.userId}/edit/${project.id}`)
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
                    <span className="text-sm text-muted-foreground">
                        Updated {new Date(project.updated_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                        })}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Link href={project.project_url} target="_blank" rel="noopener noreferrer"><Button>View Website</Button></Link>
            </CardFooter>
        </Card>
    )
}
