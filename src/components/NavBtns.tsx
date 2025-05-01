import Link from 'next/link'
import { supabase } from '@/lib/supabase/client/supabase'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'


export function Navbtns() {
    const { userId } = useSupabaseSession()
    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }
    return (
        <>
            <div className="flex items-center">
                {userId && (
                    <Link
                        href={`/${userId}`}
                        className="px-4 py-2 text-white hover:text-gray-300"
                    >
                        Profile
                    </Link>
                )}
                {userId ? (
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
        </>
    )
}