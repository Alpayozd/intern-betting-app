"use client"

import { useState, useEffect } from "react"

interface BetOption {
  id: string
  label: string
  odds: number
  _count?: {
    betSelections: number
  }
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

interface BetMarketCardProps {
  betMarket: BetMarket
  isOpen: boolean
}

export default function BetMarketCard({
  betMarket,
  isOpen,
}: BetMarketCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  // Lyt til opdateringer fra bet slip
  useEffect(() => {
    const handleSelectionsUpdate = (event: CustomEvent<BetSelection[]>) => {
      const selections = event.detail
      const selectionForThisMarket = selections.find(
        (s) => s.betMarketId === betMarket.id
      )
      setSelectedOptionId(
        selectionForThisMarket?.betOptionId || null
      )
    }

    window.addEventListener(
      "betSlipSelectionsUpdated" as any,
      handleSelectionsUpdate as EventListener
    )
    return () => {
      window.removeEventListener(
        "betSlipSelectionsUpdated" as any,
        handleSelectionsUpdate as EventListener
      )
    }
  }, [betMarket.id])

  const handleOptionClick = (option: BetOption) => {
    if (!isOpen) return

    // Send custom event til BetSlip
    const event = new CustomEvent("addToBetSlip", {
      detail: {
        betMarketId: betMarket.id,
        betMarketTitle: betMarket.title,
        betOptionId: option.id,
        betOptionLabel: option.label,
        odds: option.odds,
        stakePoints: 10, // Default stake
        potentialPayout: 10 * option.odds,
      },
    })
    window.dispatchEvent(event)
    setSelectedOptionId(option.id)
  }

  interface BetSelection {
    betMarketId: string
    betOptionId: string
  }

  const isSettled = betMarket.status === "SETTLED"
  const isClosed = betMarket.status === "CLOSED" || new Date() > new Date(betMarket.closesAt)

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              {betMarket.title}
            </h3>
            {betMarket.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {betMarket.description}
              </p>
            )}
          </div>
          <div className="sm:ml-4 sm:text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                betMarket.status === "OPEN" && !isClosed
                  ? "bg-green-100 text-green-800"
                  : betMarket.status === "SETTLED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {betMarket.status === "OPEN" && !isClosed
                ? "Åben"
                : betMarket.status === "SETTLED"
                ? "Afgjort"
                : "Lukket"}
            </span>
            {betMarket.settlement && (
              <div className="mt-2 text-xs text-gray-600">
                Vinder: {betMarket.settlement.winningOption.label}
              </div>
            )}
          </div>
        </div>
        {betMarket.status === "OPEN" && !isClosed && (
          <div className="mt-2 text-xs text-gray-500">
            Lukker: {new Date(betMarket.closesAt).toLocaleString("da-DK")}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {betMarket.betOptions.map((option) => {
            const isWinner =
              betMarket.settlement?.winningOption.label === option.label
            const isSelected = selectedOptionId === option.id
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={!isOpen || isSettled || isClosed}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isWinner
                    ? "bg-green-50 border-green-300"
                    : isSelected
                    ? "bg-blue-100 border-blue-500"
                    : isOpen && !isSettled && !isClosed
                    ? "border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-medium text-sm ${
                      isWinner ? "text-green-800" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                    {isSelected && !isWinner && (
                      <span className="ml-2 text-blue-700 font-semibold">✓ Valgt</span>
                    )}
                    {isWinner && (
                      <span className="ml-2 text-green-700">✓</span>
                    )}
                  </span>
                  <div className="text-right">
                    <span
                      className={`font-bold text-lg ${
                        isWinner
                          ? "text-green-700"
                          : isOpen && !isSettled && !isClosed
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {option.odds.toFixed(2)}
                    </span>
                    {option._count && (
                      <div className="text-xs text-gray-500 mt-1">
                        ({option._count.betSelections} bets)
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

