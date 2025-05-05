import Link from 'next/link';
import React from 'react';

export default function WelcomePage() {
    return (
        <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-gray-800">
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
                <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                    BuildSite.io
                    <span className="block text-blue-600 mt-2">Build Your Website, Without the Headache</span>
                </h1>

                <p className="text-xl md:text-2xl opacity-90">
                    Skip the coding bootcamp, keep your sanity, and still tell everyone you &apos;built it yourself&apos;.
                </p>

                {/* Time Saver Counter */}
                <div className="bg-blue-100 rounded-lg p-4 inline-block mx-auto">
                    <div className="text-lg font-medium text-blue-800">Time you&apos;ll save:</div>
                    <div className="text-2xl font-bold text-blue-600">127 hours, 43 minutes</div>
                    <div className="text-sm text-blue-700 opacity-80">(and your sanity)</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 text-blue-800">How It Works:</h2>
                    <div className="grid grid-cols-1 gap-4 text-left">
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 pt-1 w-8 h-8 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-800">Answer 5 Simple Question Sections</span>
                                <p className="text-sm text-gray-600 mt-1">Tell us about your site&apos;s purpose, style, content, and more</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 pt-1 w-8 h-8 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-800">Watch the Magic Happen</span>
                                <p className="text-sm text-gray-600 mt-1">Our wizards build your website</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 pt-1 w-8 h-8 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-800">Your Site Gets Deployed</span>
                                <p className="text-sm text-gray-600 mt-1">Automatically published to the web - no technical skills needed</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 pt-1 w-8 h-8 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M17 7L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M19 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M17 17L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M12 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M7 17L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M5 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M7 7L5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-800">View Your New Website</span>
                                <p className="text-sm text-gray-600 mt-1">See your creation live on the internet</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-600 pt-1 w-8 h-8 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4V20H20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 15L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 4H20V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="flex items-start">
                                <div>
                                    <span className="font-bold text-gray-800">Edit Your Site</span>
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="bg-yellow-100 px-2 py-1 rounded text-yellow-700 font-medium">Coming Soon</span> Site editing features are still under construction
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h3 className="font-bold text-lg mb-2 flex items-center text-red-700">
                            <span className="mr-2 w-6 h-6">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M8 12L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </span>
                            The Old Way
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Hire expensive web designers</li>
                            <li>• Wait weeks for a finished product</li>
                            <li>• Pay for every small change</li>
                            <li>• Get stuck with outdated technology</li>
                        </ul>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h3 className="font-bold text-lg mb-2 flex items-center text-green-700">
                            <span className="mr-2 w-6 h-6">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            Our Way
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Answer a few simple questions</li>
                            <li>• Enjoy a cup of coffee while our wizards work</li>
                            <li>• Get a professionally designed website</li>
                            <li>• Launch your business faster</li>
                        </ul>
                    </div>
                </div>

                {/* Achievement Badges */}
                <div className="flex flex-wrap justify-center gap-3">
                    <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                        <span className="inline-block w-4 h-4 mr-1">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 15L8.5 18L9.5 14L6.5 11.5L10.5 11L12 7L13.5 11L17.5 11.5L14.5 14L15.5 18L12 15Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        Web Design Simplified
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                        <span className="inline-block w-4 h-4 mr-1">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </span>
                        No Technical Skills Needed
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700">
                        <span className="inline-block w-4 h-4 mr-1">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        Launch Your Business Faster
                    </div>
                </div>

                <Link
                    href="/questionnaire"
                    className="inline-block bg-blue-600 text-white font-bold text-lg py-4 px-8 rounded-full hover:bg-blue-700 transform transition-all hover:scale-105 shadow-lg"
                >
                    Make Magic Happen →
                </Link>

                <div className="text-sm text-gray-500 pt-4">
                    No coding skills required. Not even a little bit.
                </div>
            </div>
        </div>
    );
}
