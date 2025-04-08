'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm, Controller } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface FeedbackDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
}

type FormData = z.infer<typeof formDataSchema>

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
const formDataSchema = z.object({
    industry: z.enum(['Marketing', 'Consulting', 'Software', 'Technology', 'Other']),
    intendedUse: z.enum(['work', 'personal', 'both', 'exploring']),
    experience: z.array(z.enum(['ease_of_use', 'features', 'design', 'needs_improvement', 'other'])),
    experienceOther: z.string().optional(),
    likeToSee: z.array(z.enum(['editing', 'download_code', 'connect_domain', 'other'])),
    likeToSeeOther: z.string().optional(),
    comments: z.string().optional(),
})
export function FeedbackDialog({ open, onOpenChange, userId }: FeedbackDialogProps) {
    const { control, handleSubmit, reset, register } = useForm<FormData>({
        defaultValues: {
            experience: [],
            likeToSee: [],
            experienceOther: '',
            likeToSeeOther: '',
        },
        resolver: zodResolver(formDataSchema)
    })

    const onSubmit = async (data: FormData) => {
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
            toast.error(`Failed to submit feedback: ${error}`)
        }
    }

    const industryOptions = [
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Consulting', label: 'Consulting' },
        { value: 'Software', label: 'Software' },
        { value: 'Technology', label: 'Technology' },
        { value: 'Other', label: 'Other' },
    ]

    const intendedUseOptions = [
        { value: 'work', label: 'Work' },
        { value: 'personal', label: 'Personal' },
        { value: 'both', label: 'Both' },
        { value: 'exploring', label: 'Just Exploring' },
    ]

    const experienceOptions = [
        { value: 'ease_of_use' as const, label: 'Easy to Use' },
        { value: 'features' as const, label: 'Great Features' },
        { value: 'design' as const, label: 'Nice Design' },
        { value: 'needs_improvement' as const, label: 'Needs Improvement' },
        { value: 'other' as const, label: 'Other' },
    ]

    const likeToSeeOptions = [
        { value: 'editing' as const, label: 'Editing' },
        { value: 'download_code' as const, label: 'Download Code' },
        { value: 'connect_domain' as const, label: 'Connect Domain' },
        { value: 'other' as const, label: 'Other' },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Share Your Feedback</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Industry */}
                    <div className="space-y-3">
                        <Label>What industry are you in?</Label>
                        <Controller
                            name="industry"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {industryOptions.map((option) => (
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

                    {/* Intended Use */}
                    <div className="space-y-3">
                        <Label>How do you plan to use this tool?</Label>
                        <Controller
                            name="intendedUse"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                    {intendedUseOptions.map((option) => (
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

                    {/* Experience */}
                    <div className="space-y-3">
                        <Label>What do you like about your experience? (Select all that apply)</Label>
                        <Controller
                            name="experience"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                        {experienceOptions.map((option) => (
                                            <SelectionTile
                                                key={option.value}
                                                selected={field.value.includes(option.value)}
                                                onClick={() => {
                                                    const newValue = field.value.includes(option.value)
                                                        ? field.value.filter(v => v !== option.value)
                                                        : [...field.value, option.value]
                                                    field.onChange(newValue)
                                                }}
                                                label={option.label}
                                            />
                                        ))}
                                    </div>
                                    {field.value.includes('other') && (
                                        <Textarea
                                            placeholder="Please specify..."
                                            {...register('experienceOther')}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {/* Like to See */}
                    <div className="space-y-3">
                        <Label>What features would you like to see? (Select all that apply)</Label>
                        <Controller
                            name="likeToSee"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                        {likeToSeeOptions.map((option) => (
                                            <SelectionTile
                                                key={option.value}
                                                selected={field.value.includes(option.value)}
                                                onClick={() => {
                                                    const newValue = field.value.includes(option.value)
                                                        ? field.value.filter(v => v !== option.value)
                                                        : [...field.value, option.value]
                                                    field.onChange(newValue)
                                                }}
                                                label={option.label}
                                            />
                                        ))}
                                    </div>
                                    {field.value.includes('other') && (
                                        <Textarea
                                            placeholder="Please specify..."
                                            {...register('likeToSeeOther')}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                        <Label htmlFor="comments">Additional Comments</Label>
                        <Textarea
                            id="comments"
                            placeholder="Share any additional thoughts or suggestions..."
                            className="min-h-[100px]"
                            {...register('comments')}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                        Submit Feedback
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
