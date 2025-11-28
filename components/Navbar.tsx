"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-[9998]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold">
              🎲 Bet with Friends
            </Link>
            {status === "authenticated" && (
              <div className="hidden md:flex items-center space-x-6 ml-8">
                <Link
                  href="/groups"
                  className="hover:text-blue-200 transition-colors"
                >
                  Grupper
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-blue-200 transition-colors"
                >
                  Profil
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {status === "authenticated" ? (
              <>
                <span className="hidden sm:inline text-sm">
                  Hej, {session?.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-blue-700 hover:bg-blue-800 px-3 sm:px-4 py-2 rounded text-sm transition-colors"
                >
                  Log ud
                </button>
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden ml-2 p-2"
                  aria-label="Menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition-colors text-sm sm:text-base"
                >
                  Log ind
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-700 hover:bg-blue-800 px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-colors"
                >
                  Opret konto
                </Link>
              </>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        {status === "authenticated" && isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-500 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/groups"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-blue-200 transition-colors py-2"
              >
                Grupper
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-blue-200 transition-colors py-2"
              >
                Profil
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

