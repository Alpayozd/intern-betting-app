"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BetOption {
  id: string
  label: string
  odds: number
}

export default function SettleBetMarketForm({
  betMarketId,
  betOptions,
}: {
  betMarketId: string
  betOptions: BetOption[]
}) {
  const router = useRouter()
  const [winningOptionId, setWinningOptionId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!winningOptionId) {
      setError("Vælg en vindende option")
      return
    }

    if (
      !confirm(
        "Er du sikker på, at du vil afgøre dette bet market? Dette kan ikke fortrydes."
      )
    ) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/bet-markets/${betMarketId}/settle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winningOptionId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      router.refresh()
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Afgør Bet Market</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="winningOption"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vindende Option
          </label>
          <select
            id="winningOption"
            value={winningOptionId}
            onChange={(e) => setWinningOptionId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Vælg vindende option...</option>
            {betOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Afgører..." : "Afgør Bet Market"}
        </button>
      </form>
    </div>
  )
}

