"use client"

import { useState, useEffect } from "react"
import { formatNumber } from "@/lib/format"

interface Bet {
  id: string
  betOption: {
    id: string
    label: string
    odds: number
  }
  stakePoints: number
  potentialPayoutPoints: number
  createdAt: Date
}

interface MyBetsSectionProps {
  betSubMarketId: string
  betSubMarketTitle: string
  isSettled: boolean
  winningOptionIds?: string[]
}

export default function MyBetsSection({
  betSubMarketId,
  betSubMarketTitle,
  isSettled,
  winningOptionIds = [],
}: MyBetsSectionProps) {
  const [bets, setBets] = useState<Bet[]>([])
  const [totalStake, setTotalStake] = useState(0)
  const [totalPotentialPayout, setTotalPotentialPayout] = useState(0)
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMyBets()
      // Opdater hver 5 sekunder når sektionen er åben
      const interval = setInterval(fetchMyBets, 5000)
      return () => clearInterval(interval)
    }
  }, [betSubMarketId, isOpen])

  const fetchMyBets = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(
        `/api/bet-sub-markets/${betSubMarketId}/my-bets`
      )
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
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  // Tjek om bet er vinder
  const isWinningBet = (betOptionId: string) => {
    return winningOptionIds.includes(betOptionId)
  }

  return (
    <div className="bg-white border-2 border-blue-400 rounded-lg shadow-md">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setLoading(true)
            fetchMyBets()
          }
        }}
        className="w-full flex justify-between items-center p-4 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
            Mine Bets
          </h3>
          {bets.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {bets.length}
            </span>
          )}
        </div>
        <span className="text-gray-600 text-sm font-bold">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div className="border-t-2 border-gray-200 p-4 space-y-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <p>Henter...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-600 text-white px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Points og totals */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    Dine points:
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatNumber(userPoints)} pts
                  </span>
                </div>
                {bets.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        Total sat:
                      </span>
                      <span className="text-base font-bold text-gray-900">
                        {formatNumber(totalStake)} pts
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {isSettled ? "Gevinst:" : "Potentiel gevinst:"}
                      </span>
                      <span className="text-base font-bold text-green-600">
                        {formatNumber(Math.round(totalPotentialPayout))} pts
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Liste af bets */}
              {bets.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <p>Du har ikke placeret nogen bets endnu</p>
                </div>
              ) : (
            <div className="space-y-2">
              {bets.map((bet) => {
                const isWinner = isWinningBet(bet.betOption.id)
                return (
                  <div
                    key={bet.id}
                    className={`border-2 rounded-lg p-3 ${
                      isSettled && isWinner
                        ? "bg-green-50 border-green-300"
                        : isSettled && !isWinner
                        ? "bg-red-50 border-red-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {bet.betOption.label}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Odds: {bet.betOption.odds.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Stake</p>
                        <p className="font-bold text-gray-900 text-sm">
                          {formatNumber(bet.stakePoints)} pts
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {isSettled ? "Gevinst" : "Potentiel gevinst"}
                        </p>
                        <p
                          className={`font-bold text-sm ${
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
                      Placeret: {new Date(bet.createdAt).toLocaleString("da-DK")}
                    </p>
                  </div>
                )
              })}
              </div>
            )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

