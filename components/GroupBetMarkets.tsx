"use client"

import { useState } from "react"
import BetMarketCard from "./BetMarketCard"
import BetSlip from "./BetSlip"

interface BetOption {
  id: string
  label: string
  odds: number
}

interface BetMarket {
  id: string
  title: string
  description?: string | null
  status: string
  closesAt: Date
  betOptions: BetOption[]
  settlement?: {
    winningOption: {
      label: string
    }
  } | null
}

interface GroupBetMarketsProps {
  betMarkets: BetMarket[]
  userPoints: number
  groupId: string
}

export default function GroupBetMarkets({
  betMarkets,
  userPoints,
  groupId,
}: GroupBetMarketsProps) {
  const [isPlacing, setIsPlacing] = useState(false)

  const handlePlaceBets = async (selections: any[]) => {
    setIsPlacing(true)
    try {
      // Placér hvert bet individuelt
      for (const selection of selections) {
        const response = await fetch("/api/bet-selections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            betMarketId: selection.betMarketId,
            betOptionId: selection.betOptionId,
            stakePoints: selection.stakePoints,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fejl ved placering af bet")
        }
      }

      // Refresh siden for at opdatere point saldo
      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Der opstod en fejl ved placering af bets")
      throw error
    } finally {
      setIsPlacing(false)
    }
  }

  const openMarkets = betMarkets.filter(
    (m) =>
      m.status === "OPEN" &&
      new Date() < new Date(m.closesAt)
  )
  const closedMarkets = betMarkets.filter(
    (m) => m.status !== "OPEN" || new Date() >= new Date(m.closesAt)
  )

  return (
    <>
      <div className="mb-8">
        {openMarkets.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Åbne Bet Markets
            </h2>
            {openMarkets.map((market) => (
              <BetMarketCard
                key={market.id}
                betMarket={market}
                isOpen={true}
              />
            ))}
          </div>
        )}

        {closedMarkets.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Lukkede / Afgjorte Bet Markets
            </h2>
            {closedMarkets.map((market) => (
              <BetMarketCard
                key={market.id}
                betMarket={market}
                isOpen={false}
              />
            ))}
          </div>
        )}

        {betMarkets.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="text-lg mb-2">Ingen bet markets endnu</p>
            <p className="text-sm">
              Opret et nyt bet market for at komme i gang!
            </p>
          </div>
        )}
      </div>

      <BetSlip userPoints={userPoints} onPlaceBets={handlePlaceBets} />
    </>
  )
}

