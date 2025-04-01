'use client'
import { supabase } from "@/lib/supabase/client/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"

function SignInContent() {
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') || '/'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (isSignUp) {
            // Sign up
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `/${encodeURIComponent(returnUrl)}`
                }
            })
            if (error) {
                setError(error.message)
            } else {
                setError('Please check your email for the confirmation link.')
            }
        } else {
            // Sign in
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) {
                setError(error.message)
            } else {
                router.push(`/${returnUrl}`)
            }
        }
        setLoading(false)
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
            }
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>

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
                    {loading ? 'Loading...' : isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}
                </button>
            </form>

            <div className="mt-4">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white border border-gray-300 p-2 rounded hover:bg-gray-50"
                >
                    {isSignUp ? 'Sign Up' : 'Sign In'} with Google
                </button>
            </div>

            <div className="mt-4 text-center">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-blue-500 hover:text-blue-600"
                >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
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
