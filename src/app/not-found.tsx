import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-6">Could not find the requested page</p>
            <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
                Return Home
            </Link>
        </div>
    )
} 