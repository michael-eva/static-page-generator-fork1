'use client'
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/WaitlistDialog";
import { useDialog } from "@/hooks/use-dialog";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useRouter } from "next/navigation";

export default function LimitReached() {
    const { toggle, isOpen } = useDialog()
    const { toggle: toggleWaitlist, isOpen: isOpenWaitlist } = useDialog()
    const { userId } = useSupabaseSession()
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {/* Main Content */}
            <div className="flex flex-col items-center justify-center py-16 px-4 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-blue-100">
                    {/* Illustration */}
                    <div className="flex justify-center mb-6">
                        <div className="w-64 h-64 text-blue-500">
                            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Browser Window Frame */}
                                <rect x="20" y="20" width="160" height="140" rx="8" stroke="currentColor" strokeWidth="4" />

                                {/* Browser Top Bar */}
                                <path d="M20 45 H180" stroke="currentColor" strokeWidth="4" />

                                {/* Browser Controls */}
                                <circle cx="35" cy="32.5" r="4" fill="currentColor" />
                                <circle cx="50" cy="32.5" r="4" fill="currentColor" />
                                <circle cx="65" cy="32.5" r="4" fill="currentColor" />

                                {/* URL Bar */}
                                <rect x="35" y="52.5" width="130" height="15" rx="4" stroke="currentColor" strokeWidth="2" />

                                {/* Main Content Area - Showing a "Stop" or "Limit" Symbol */}
                                <circle cx="100" cy="110" r="30" stroke="currentColor" strokeWidth="4" />
                                <path d="M80 110 H120" stroke="currentColor" strokeWidth="4" />

                                {/* Connection Line */}
                                <path d="M100 140 L100 160" stroke="currentColor" strokeWidth="4" />

                                {/* Bottom Platform */}
                                <rect x="70" y="160" width="60" height="10" rx="5" stroke="currentColor" strokeWidth="4" />
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-4 text-gray-800">Website Limit Reached</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Thank you for your interest! We&apos;ve reached our current limit for
                            new websites during this testing phase. You can still view and
                            manage your existing websites in your profile.
                        </p>

                        <div className="space-y-4">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-all"
                                onClick={() => router.push(!userId ? "auth/sign-in" : `/${userId}`)}
                            >
                                View My Websites
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 py-3 px-6 rounded-lg text-lg font-medium transition-all"
                                onClick={toggle}
                            >
                                Provide Feedback
                            </Button>

                            <FeedbackDialog open={isOpen} onOpenChange={toggle} userId={userId || ""} />
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Want to be notified when we increase capacity?</p>
                    <Button
                        variant="link"
                        onClick={toggleWaitlist}
                        className="underline"
                    >
                        Join our waitlist
                    </Button>
                </div>
            </div>
            <WaitlistDialog open={isOpenWaitlist} onOpenChange={toggleWaitlist} />
        </div>
    );
}