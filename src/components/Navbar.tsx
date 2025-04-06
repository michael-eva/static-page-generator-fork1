'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client/supabase'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return (
        <nav className="bg-blue-700 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/questionnaire" className="flex items-center px-2 py-2 text-white hover:text-gray-300">
                            Build Site
                        </Link>
                    </div>
                    <div className="flex items-center">
                        {user && (
                            <Link
                                href={`/${user.id}`}
                                className="px-4 py-2 text-white hover:text-gray-300"
                            >
                                Profile
                            </Link>
                        )}
                        {user ? (
                            <Link
                                href="/"
                                className="px-4 py-2 text-white hover:text-gray-300"
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </Link>
                        ) : (
                            <Link
                                href="/auth/sign-in"
                                className="px-4 py-2 text-white hover:text-gray-300"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
} 