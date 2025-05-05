"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client/supabase"
import { useState } from "react"

interface WaitlistDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function WaitlistDialog({ open, onOpenChange }: WaitlistDialogProps) {
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([
                    { name, email }
                ])

            if (error) throw error

            setSubmitted(true)
        } catch (err) {
            console.error('Error submitting to waitlist:', err)
            setError("Failed to join waitlist. Please try again later.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">Join the Waitlist</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Be the first to know when we increase capacity for new websites.
                    </DialogDescription>
                </DialogHeader>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-red-600 text-sm">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Join Waitlist"}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-green-600 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Thank you for joining!</h3>
                        <p className="text-gray-600">
                            We&apos;ll notify you as soon as we have space available.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
