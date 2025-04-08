'use client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client/supabase'
import { recoverFormData, clearFormData } from '@/lib/formDataPersistence'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || 'questionnaire'

    useEffect(() => {
        // Check auth status and redirect
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Try to recover form data when authenticated successfully
                if (returnUrl === 'questionnaire') {
                    try {
                        // Use user's email to potentially recover form data
                        const savedData = recoverFormData();
                        if (savedData) {
                            // Set the recovered data to localStorage so it's available on the form page
                            localStorage.setItem('websiteBuilder', savedData);
                            // Clear persisted data to prevent data leakage
                            clearFormData();
                        }
                    } catch (error) {
                        console.error('Error recovering form data:', error);
                    }
                }
                
                router.push(`/${returnUrl}`)
            } else {
                router.push('/auth/sign-in')
            }
        })
    }, [router, returnUrl])

    return <div>Loading...</div>
}

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}