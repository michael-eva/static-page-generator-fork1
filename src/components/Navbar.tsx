import Link from 'next/link'
import { Navbtns } from './NavBtns'

export default function Navbar() {
    return (
        <nav className="bg-blue-700 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/questionnaire" className="flex items-center px-2 py-2 text-white hover:text-gray-300">
                            Build Site
                        </Link>
                    </div>

                    <Navbtns />
                </div>
            </div>
        </nav>
    )
}

