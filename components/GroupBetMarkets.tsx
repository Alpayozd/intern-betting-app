"use client"

import { useState } from "react"
import BetMarketCard from "./BetMarketCard"
import BetSlip from "./BetSlip"

interface BetOption {
  id: string
  label: string
  odds: number
  _count?: {
    betSelections: number
  }
}

interface BetSubMarket {
  id: string
  title: string
  description?: string | null
  status: string
  closesAt: Date
  allowMultipleBets?: boolean
  betOptions: BetOption[]
  settlement?: {
    winningOptions: {
      betOption: {
        id: string
        label: string
      }
    }[]
  } | null
}

interface BetMarket {
  id: string
  title: string
  description?: string | null
  status: string
  closesAt: Date
  betSubMarkets: BetSubMarket[]
}

interface GroupBetMarketsProps {
  betMarkets: BetMarket[]
  userPoints: number
  groupId: string
  isAdmin: boolean
}

export default function GroupBetMarkets({
  betMarkets,
  userPoints,
  groupId,
  isAdmin,
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
            betSubMarketId: selection.betSubMarketId,
            betOptionId: selection.betOptionId,
            stakePoints: Number(selection.stakePoints), // Sikrer at det er et number
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
                isAdmin={isAdmin}
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
                isAdmin={isAdmin}
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

