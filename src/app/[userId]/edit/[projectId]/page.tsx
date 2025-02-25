import { use } from 'react'

interface PageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

export default function ProjectEditPage({ params }: PageProps) {
    const resolvedParams = use(params)
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-4">Edit Project {resolvedParams.projectId}</h1>
            <div className="bg-white shadow-sm rounded-lg p-6">
                <pre className="text-sm text-gray-600">
                    User ID: {resolvedParams.userId}
                    {'\n'}
                    Project ID: {resolvedParams.projectId}
                </pre>
            </div>
        </div>
    )
} 