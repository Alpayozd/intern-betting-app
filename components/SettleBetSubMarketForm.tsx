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
  const [winningOptionIds, setWinningOptionIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleOptionToggle = (optionId: string) => {
    setWinningOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId)
      } else {
        return [...prev, optionId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (winningOptionIds.length === 0) {
      setError("Vælg mindst én vinder")
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
          body: JSON.stringify({ winningOptionIds }),
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

  // Debug: Log betOptions
  if (typeof window !== 'undefined') {
    console.log('SettleBetSubMarketForm - betOptions:', betOptions)
    console.log('SettleBetSubMarketForm - betOptions type:', typeof betOptions)
    console.log('SettleBetSubMarketForm - betOptions isArray:', Array.isArray(betOptions))
    console.log('SettleBetSubMarketForm - betOptions length:', betOptions?.length)
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
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Vælg vinder(e) (kan vælge flere):
          </label>
          {betOptions && Array.isArray(betOptions) && betOptions.length > 0 ? (
            <div className="space-y-2">
              {betOptions.map((option) => {
                if (!option || !option.id) {
                  console.warn('Invalid option:', option)
                  return null
                }
                const isSelected = winningOptionIds.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-3 sm:p-2 border rounded-md cursor-pointer hover:bg-gray-50 active:bg-gray-100 min-h-[52px] sm:min-h-[auto] touch-manipulation"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleOptionToggle(option.id)}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 touch-manipulation"
                    />
                    <span className="text-base sm:text-sm text-gray-700 flex-1">
                      {option.label || 'Ingen label'} <span className="text-gray-500">(Odds: {option.odds ? option.odds.toFixed(2) : 'N/A'})</span>
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
              <p>Ingen options tilgængelige</p>
              <p className="text-xs mt-1">betOptions: {betOptions ? JSON.stringify(betOptions) : 'undefined'}</p>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-yellow-700 active:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
        >
          {isSubmitting ? "Afgører..." : "Afgør Bet"}
        </button>
      </form>
    </div>
  )
}

