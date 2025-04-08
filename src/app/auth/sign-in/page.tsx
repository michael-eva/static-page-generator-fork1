'use client'
import { supabase } from "@/lib/supabase/client/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { FcGoogle } from 'react-icons/fc'

function SignInContent() {
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || 'questionnaire'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Try sign in first
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            // If error indicates user doesn't exist, try signing up
            if (signInError.message.includes('Invalid login credentials')) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `/${encodeURIComponent(returnUrl)}`
                    }
                })

                if (signUpError) {
                    setError(signUpError.message)
                } else {
                    setError('Please check your email for the confirmation link.')
                }
            } else {
                setError(signInError.message)
            }
        } else {
            router.push(`/${returnUrl}`)
        }

        setLoading(false)
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError(null)

        const redirectUrl = `/${returnUrl}`;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
            }
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Sign In / Sign Up</h1>

            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    {loading ? 'Loading...' : 'Continue with Email'}
                </button>
            </form>

            <div className="mt-4">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white border border-gray-300 p-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <FcGoogle className="text-xl" />
                    Sign In with Google
                </button>
            </div>

            {error && (
                <div className="mt-4 text-red-500">
                    {error}
                </div>
            )}
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInContent />
        </Suspense>
    )
}
