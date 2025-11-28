"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      router.push(`/groups/${data.group.id}`)
      router.refresh()
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Opret Ny Gruppe</h2>
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
            Gruppens navn *
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
            htmlFor="description"
            className="block text-sm sm:text-base font-semibold text-gray-900 mb-2"
          >
            Beskrivelse (valgfri)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 sm:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-md min-h-[48px] sm:min-h-[auto]"
        >
          {loading ? "Opretter..." : "Opret Gruppe"}
        </button>
      </form>
    </div>
  )
}

