'use client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client/supabase'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || 'questionnaire'

    useEffect(() => {
        // Check auth status and redirect
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
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