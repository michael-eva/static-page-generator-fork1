'use client'
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/hooks/use-dialog";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function GlobalInfoBanner() {
    const { toggle, isOpen } = useDialog()
    const { userId } = useSupabaseSession()
    if (!userId) return null
    return (
        <div className="bg-yellow-300 w-full">
            <div className="flex flex-col sm:flex-row gap-2 justify-center py-3 px-4 items-center text-center">
                <p className="text-sm sm:text-base">Scientists discovered leaving feedback makes you 127.3% more attractive</p>
                <Button className="whitespace-nowrap" onClick={toggle}>Make Me Irresistible</Button>
            </div>
            <FeedbackDialog
                open={isOpen}
                onOpenChange={toggle}
                userId={userId}
            />
        </div>
    )
}