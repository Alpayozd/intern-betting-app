"use client"

import { useState, useEffect } from "react"
import { formatNumber } from "@/lib/format"
import Link from "next/link"

interface Bet {
  id: string
  betSubMarket: {
    id: string
    title: string
    status: string
    betMarket: {
      id: string
      title: string
    }
    settlement: {
      winningOptions: {
        betOption: {
          id: string
        }
      }[]
    } | null
  }
  betOption: {
    id: string
    label: string
    odds: number
  }
  stakePoints: number
  potentialPayoutPoints: number
  createdAt: Date
}

interface MyBetsListProps {
  groupId: string
}

export default function MyBetsList({ groupId }: MyBetsListProps) {
  const [bets, setBets] = useState<Bet[]>([])
  const [totalStake, setTotalStake] = useState(0)
  const [totalPotentialPayout, setTotalPotentialPayout] = useState(0)
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    fetchMyBets()
    // Opdater hver 5 sekunder
    const interval = setInterval(fetchMyBets, 5000)
    return () => clearInterval(interval)
  }, [groupId])

  const fetchMyBets = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/my-bets`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved hentning af bets")
        setLoading(false)
        return
      }

      setBets(data.bets || [])
      setTotalStake(data.totalStake || 0)
      setTotalPotentialPayout(data.totalPotentialPayout || 0)
      setUserPoints(data.userPoints || 0)
      setError("")
      setLoading(false)
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
      setLoading(false)
    }
  }

  // Tjek om bet er vinder
  const isWinningBet = (bet: Bet) => {
    if (!bet.betSubMarket.settlement) return false
    return bet.betSubMarket.settlement.winningOptions.some(
      (wo) => wo.betOption.id === bet.betOption.id
    )
  }

  // Gruppér bets efter bet market
  const groupedBets = bets.reduce((acc, bet) => {
    const marketId = bet.betSubMarket.betMarket.id
    const marketTitle = bet.betSubMarket.betMarket.title
    if (!acc[marketId]) {
      acc[marketId] = {
        marketTitle,
        marketId,
        bets: [],
      }
    }
    acc[marketId].bets.push(bet)
    return acc
  }, {} as Record<string, { marketTitle: string; marketId: string; bets: Bet[] }>)

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-400">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-6 border-b-2 border-gray-200 bg-blue-50 flex justify-between items-center hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation min-h-[64px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-xl">📋</span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            Mine Bets
          </h2>
          {bets.length > 0 && (
            <span className="bg-blue-600 text-white text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full">
              {bets.length}
            </span>
          )}
        </div>
        <span className="text-gray-700 text-xl sm:text-lg font-bold">
          {isOpen ? "▼" : "▶"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henter bets...</p>
            </div>
          ) : error ? (
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Du har ikke placeret nogen bets endnu</p>
            </div>
          ) : (
            <>
              {/* Points og totals */}
              <div className="bg-blue-600 border-2 border-blue-700 rounded-lg p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-bold text-white">
                    Dine points:
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {formatNumber(userPoints)} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-bold text-white">
                    Total sat:
                  </span>
                  <span className="text-base sm:text-lg font-bold text-white">
                    {formatNumber(totalStake)} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-bold text-white">
                    Potentiel gevinst:
                  </span>
                  <span className="text-base sm:text-lg font-bold text-green-200">
                    {formatNumber(Math.round(totalPotentialPayout))} pts
                  </span>
                </div>
              </div>

              {/* Liste af bets grupperet efter bet market */}
              <div className="space-y-4">
                {Object.values(groupedBets).map((group) => (
                  <div key={group.marketId} className="space-y-2">
                    <Link
                      href={`/bet-markets/${group.marketId}`}
                      className="block text-base sm:text-lg font-bold text-blue-600 hover:text-blue-800 mb-2"
                    >
                      {group.marketTitle}
                    </Link>
                    {group.bets.map((bet) => {
                      const isSettled =
                        bet.betSubMarket.status === "SETTLED"
                      const isWinner = isSettled && isWinningBet(bet)

                      return (
                        <div
                          key={bet.id}
                          className={`border-2 rounded-lg p-3 sm:p-4 ${
                            isSettled && isWinner
                              ? "bg-green-50 border-green-300"
                              : isSettled && !isWinner
                              ? "bg-red-50 border-red-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                {bet.betSubMarket.title}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {bet.betOption.label} @ {bet.betOption.odds.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">Stake</p>
                              <p className="font-bold text-gray-900 text-sm sm:text-base">
                                {formatNumber(bet.stakePoints)} pts
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {isSettled ? "Gevinst" : "Potentiel gevinst"}
                              </p>
                              <p
                                className={`font-bold text-sm sm:text-base ${
                                  isSettled && isWinner
                                    ? "text-green-600"
                                    : isSettled && !isWinner
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {formatNumber(Math.round(bet.potentialPayoutPoints))}{" "}
                                pts
                              </p>
                            </div>
                          </div>
                          {isSettled && (
                            <div className="mt-2">
                              {isWinner ? (
                                <span className="inline-block bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                                  ✓ Vinder
                                </span>
                              ) : (
                                <span className="inline-block bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                                  ✗ Tabt
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Placeret:{" "}
                            {new Date(bet.createdAt).toLocaleString("da-DK")}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

