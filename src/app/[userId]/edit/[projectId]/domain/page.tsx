'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface DomainPageProps {
    params: Promise<{
        userId: string;
        projectId: string;
    }>;
}

export default function DomainPage({ params }: DomainPageProps) {
    const router = useRouter();
    const { userId, projectId } = use(params);

    useEffect(() => {
        router.push(`/${userId}/edit/${projectId}/domain/input`);
    }, [userId, projectId, router]);

    return null;
} 