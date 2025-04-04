'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm, Controller } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

interface FeedbackDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
}

type FeedbackForm = {
    satisfaction: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied'
    wouldRecommend: 'yes' | 'no' | 'maybe'
    comments: string
}

interface SelectionTileProps {
    selected: boolean
    onClick: () => void
    label: string
    className?: string
}

function SelectionTile({ selected, onClick, label, className }: SelectionTileProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-4 rounded-lg border-2 cursor-pointer transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                selected ? "border-primary bg-primary/10" : "border-muted",
                className
            )}
        >
            <p className="text-center font-medium">{label}</p>
        </div>
    )
}

export function FeedbackDialog({ open, onOpenChange, userId }: FeedbackDialogProps) {
    const { control, handleSubmit, reset, register } = useForm<FeedbackForm>()

    const onSubmit = async (data: FeedbackForm) => {
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    ...data
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast.success("Thank you for your feedback!")
                reset()
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to submit feedback")
            }
        } catch (error) {
            toast.error("Failed to submit feedback")
        }
    }

    const satisfactionOptions = [
        { value: 'very_satisfied', label: 'Very Satisfied' },
        { value: 'satisfied', label: 'Satisfied' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'dissatisfied', label: 'Dissatisfied' },
        { value: 'very_dissatisfied', label: 'Very Dissatisfied' },
    ]

    const recommendOptions = [
        { value: 'yes', label: 'Yes' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'no', label: 'No' },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Share Your Feedback</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Satisfaction Rating */}
                    <div className="space-y-3">
                        <Label>How satisfied are you with our service?</Label>
                        <Controller
                            name="satisfaction"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 gap-3">
                                    {satisfactionOptions.map((option) => (
                                        <SelectionTile
                                            key={option.value}
                                            selected={field.value === option.value}
                                            onClick={() => field.onChange(option.value)}
                                            label={option.label}
                                        />
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* Would Recommend */}
                    <div className="space-y-3">
                        <Label>Would you recommend us to others?</Label>
                        <Controller
                            name="wouldRecommend"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="grid grid-cols-3 gap-3">
                                    {recommendOptions.map((option) => (
                                        <SelectionTile
                                            key={option.value}
                                            selected={field.value === option.value}
                                            onClick={() => field.onChange(option.value)}
                                            label={option.label}
                                        />
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* Additional Comments */}
                    <div className="space-y-3">
                        <Label htmlFor="comments">Additional Comments</Label>
                        <Textarea
                            id="comments"
                            placeholder="Share any additional thoughts or suggestions..."
                            className="min-h-[100px]"
                            {...register('comments')}
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Submit Feedback
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
