"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function JoinGroupForm() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      setSuccess("Du er nu medlem af gruppen!")
      setInviteCode("")
      setTimeout(() => {
        router.push(`/groups/${data.groupId}`)
        router.refresh()
      }, 1000)
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Join Gruppe</h2>
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md border-2 border-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md border-2 border-green-700">
          <p className="font-semibold">{success}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="inviteCode"
            className="block text-sm sm:text-base font-semibold text-gray-900 mb-2"
          >
            Invite Code
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            placeholder="FX: ABC12345"
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 sm:py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-md min-h-[48px] sm:min-h-[auto]"
        >
          {loading ? "Joiner..." : "Join Gruppe"}
        </button>
      </form>
    </div>
  )
}

