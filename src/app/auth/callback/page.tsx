'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || '/'

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