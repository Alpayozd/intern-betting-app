"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatNumber } from "@/lib/format"

interface BetOption {
  id: string
  label: string
  odds: number
}

export default function PlaceBetForm({
  betMarketId,
  betOptions,
  userPoints,
}: {
  betMarketId: string
  betOptions: BetOption[]
  userPoints: number
}) {
  const router = useRouter()
  const [betOptionId, setBetOptionId] = useState("")
  const [stakePoints, setStakePoints] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const stake = parseInt(stakePoints)
    if (!betOptionId) {
      setError("Vælg en option")
      return
    }

    if (!stake || stake <= 0) {
      setError("Stake skal være positiv")
      return
    }

    if (stake > userPoints) {
      setError(`Du har kun ${userPoints} points`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/bet-selections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betMarketId,
          betOptionId,
          stakePoints: stake,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      router.refresh()
      setBetOptionId("")
      setStakePoints("")
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  const selectedOption = betOptions.find((opt) => opt.id === betOptionId)
  const potentialPayout = selectedOption
    ? parseInt(stakePoints) * selectedOption.odds
    : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Placér Bet</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="betOption"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vælg Option
          </label>
          <select
            id="betOption"
            value={betOptionId}
            onChange={(e) => setBetOptionId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Vælg...</option>
            {betOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} (Odds: {option.odds.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="stakePoints"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Stake (points)
          </label>
          <input
            id="stakePoints"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            max={userPoints}
            value={stakePoints}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '')
              // Fjern leading zeros
              const cleanValue = value.replace(/^0+/, '') || ''
              setStakePoints(cleanValue)
            }}
            onFocus={(e) => {
              // Når feltet får fokus og værdien er 0, clear det
              if (e.target.value === '0') {
                e.target.value = ''
                setStakePoints('')
              }
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tilgængelige points: {formatNumber(userPoints)}
          </p>
        </div>

        {selectedOption && stakePoints && parseInt(stakePoints) > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm">
              <strong>Potentiel gevinst:</strong>{" "}
              {potentialPayout.toFixed(0)} points
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Placerer..." : "Placér Bet"}
        </button>
      </form>
    </div>
  )
}

