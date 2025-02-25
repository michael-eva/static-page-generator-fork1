import { useState, useCallback } from 'react'

interface UseDialogReturn {
    isOpen: boolean
    open: () => void
    close: () => void
    toggle: () => void
}

export function useDialog(initialState: boolean = false): UseDialogReturn {
    const [isOpen, setIsOpen] = useState<boolean>(initialState)

    const open = useCallback(() => {
        setIsOpen(true)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
    }, [])

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev)
    }, [])

    return {
        isOpen,
        open,
        close,
        toggle
    }
}
