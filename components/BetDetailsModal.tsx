"use client"

import { useState, useEffect } from "react"
import { formatNumber } from "@/lib/format"

interface Bet {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
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

interface BetDetailsModalProps {
  betSubMarketId: string
  betSubMarketTitle: string
  isOpen: boolean
  onClose: () => void
}

export default function BetDetailsModal({
  betSubMarketId,
  betSubMarketTitle,
  isOpen,
  onClose,
}: BetDetailsModalProps) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && betSubMarketId) {
      fetchBets()
    }
  }, [isOpen, betSubMarketId])

  const fetchBets = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(
        `/api/bet-sub-markets/${betSubMarketId}/bets`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved hentning af bets")
        return
      }

      setBets(data.bets || [])
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[10001] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">Bet Detaljer</h2>
            <p className="text-sm opacity-90">{betSubMarketTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 active:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center touch-manipulation"
            aria-label="Luk"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henter bets...</p>
            </div>
          ) : error ? (
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold">{error}</p>
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Ingen bets placeret endnu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {bet.user.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {bet.betOption.label} @ {bet.betOption.odds.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Stake</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {formatNumber(bet.stakePoints)} pts
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Potentiel gevinst</p>
                      <p className="font-bold text-green-600 text-sm">
                        {formatNumber(Math.round(bet.potentialPayoutPoints))} pts
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Placeret: {new Date(bet.createdAt).toLocaleString("da-DK")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-4 py-3 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-700 font-medium">
            Total: {bets.length} bet{bets.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors text-sm font-semibold min-h-[36px] touch-manipulation"
          >
            Luk
          </button>
        </div>
      </div>
    </div>
  )
}

