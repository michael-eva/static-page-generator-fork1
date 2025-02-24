'use client'
import { MoreHorizontal, Star } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { use } from 'react'

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

// Example project data
const projects = [
    {
        id: 1,
        title: "E-commerce Website",
        image: "/placeholder.svg?height=200&width=400",
        status: "Live",
        lastUpdated: "2 hours ago",
        stars: 24,
        url: "https://example.com",
    },
    {
        id: 2,
        title: "Mobile App Dashboard",
        image: "/placeholder.svg?height=200&width=400",
        status: "In Development",
        lastUpdated: "3 days ago",
        stars: 12,
        url: "https://example.com",
    },
    {
        id: 3,
        title: "Marketing Landing Page",
        image: "/placeholder.svg?height=200&width=400",
        status: "Planning",
        lastUpdated: "1 week ago",
        stars: 8,
        url: "https://example.com",
    },
]

interface DashboardProps {
    params: Promise<{ userId: string }>;
}

export default function Dashboard({ params }: DashboardProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    async function handleCreateNewProject() {
        router.push('/template')
    }

    return (
        <div className="min-h-screen w-full bg-muted/40 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">My Projects</h1>
                    <Button onClick={handleCreateNewProject}>Create New Project</Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="overflow-hidden" onClick={() => router.push(`/${resolvedParams.userId}/edit/${project.id}`)}>
                            <div className="aspect-video relative">
                                <Image
                                    src={project.image || "/placeholder.svg"}
                                    alt={project.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>View Project</DropdownMenuItem>
                                        <DropdownMenuItem>View Deployment</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>Project Settings</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Badge variant={project.status === "Live" ? "default" : "secondary"} className="rounded-md">
                                        {project.status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">Updated {project.lastUpdated}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <a
                                    href={project.url}
                                    className="text-sm text-muted-foreground hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {project.url}
                                </a>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    <span className="text-sm font-medium">{project.stars}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

