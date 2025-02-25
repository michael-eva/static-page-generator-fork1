import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CustomDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    continueText?: string
    cancelText?: string
    onContinue: () => void
    onCancel?: () => void
    loading?: boolean
}

export function CustomDialog({
    isOpen,
    onClose,
    title,
    children,
    continueText = "Continue",
    cancelText = "Cancel",
    onContinue,
    onCancel,
    loading = false
}: CustomDialogProps) {
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {children}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onContinue}
                        disabled={loading}
                    >
                        {continueText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
