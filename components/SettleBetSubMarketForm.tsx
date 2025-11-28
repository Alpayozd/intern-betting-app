"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BetOption {
  id: string
  label: string
  odds: number
}

interface SettleBetSubMarketFormProps {
  betSubMarketId: string
  betOptions: BetOption[]
  isSettled: boolean
}

export default function SettleBetSubMarketForm({
  betSubMarketId,
  betOptions,
  isSettled,
}: SettleBetSubMarketFormProps) {
  const router = useRouter()
  const [winningOptionId, setWinningOptionId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!winningOptionId) {
      setError("Vælg en vinder")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/bet-sub-markets/${betSubMarketId}/settle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ winningOptionId }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      // Opdater siden
      router.refresh()
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSettled) {
    return null // Vis ikke form hvis allerede afgjort
  }

  return (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h5 className="text-sm font-semibold text-yellow-900 mb-2">
        Afgør Bet (Admin)
      </h5>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Vælg vinder:
          </label>
          <select
            value={winningOptionId}
            onChange={(e) => setWinningOptionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          >
            <option value="">-- Vælg vinder --</option>
            {betOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} (Odds: {option.odds.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? "Afgører..." : "Afgør Bet"}
        </button>
      </form>
    </div>
  )
}

