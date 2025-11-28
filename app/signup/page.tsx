"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      // Redirect til login efter signup
      router.push("/login?signup=success")
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-16">
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Opret konto
          </h1>

          {error && (
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md border-2 border-red-700">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm sm:text-base font-semibold text-gray-900 mb-2"
              >
                Navn
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm sm:text-base font-semibold text-gray-900 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm sm:text-base font-semibold text-gray-900 mb-2"
              >
                Password (minimum 6 tegn)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-md min-h-[48px] sm:min-h-[auto]"
            >
              {loading ? "Opretter..." : "Opret konto"}
            </button>
          </form>

          <p className="mt-4 text-center text-base sm:text-sm text-gray-700 font-medium">
            Har du allerede en konto?{" "}
            <Link href="/login" className="text-blue-700 hover:text-blue-900 font-semibold">
              Log ind
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

