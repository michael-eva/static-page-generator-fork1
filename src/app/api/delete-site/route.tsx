import { DeleteSite } from "@/app/services/db"
import { S3Service } from "@/app/services/s3"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { siteId } = data

        if (!siteId) {
            return NextResponse.json(
                { error: 'siteId is required' },
                { status: 400 }
            )
        }
        const s3 = new S3Service()
        await s3.deleteSite(siteId)
        await DeleteSite({ siteId })
        return NextResponse.json({ message: "Site deleted" })
    } catch (error) {
        console.error('Error deleting site:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete site' },
            { status: 400 }
        )
    }
}