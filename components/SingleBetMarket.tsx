"use client"

import { useState } from "react"
import BetSlip from "./BetSlip"
import BetMarketCard from "./BetMarketCard"

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
    winningOption: {
      label: string
    }
    winningOptionId: string
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

interface SingleBetMarketProps {
  betMarket: BetMarket
  userPoints: number
  groupId: string
}

export default function SingleBetMarket({
  betMarket,
  userPoints,
  groupId,
}: SingleBetMarketProps) {
  const [isPlacing, setIsPlacing] = useState(false)

  const handlePlaceBets = async (selections: any[]) => {
    setIsPlacing(true)
    try {
      for (const selection of selections) {
        const response = await fetch("/api/bet-selections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            betSubMarketId: selection.betSubMarketId,
            betOptionId: selection.betOptionId,
            stakePoints: selection.stakePoints,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fejl ved placering af bet")
        }
      }

      window.location.reload()
    } catch (error: any) {
      alert(error.message || "Der opstod en fejl ved placering af bets")
      throw error
    } finally {
      setIsPlacing(false)
    }
  }

  const isOpen = betMarket.status === "OPEN" && new Date() < new Date(betMarket.closesAt)

  return (
    <>
      <BetMarketCard betMarket={betMarket} isOpen={isOpen} isAdmin={false} />
      <BetSlip userPoints={userPoints} onPlaceBets={handlePlaceBets} />
    </>
  )
}

