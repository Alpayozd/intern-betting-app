"use client"

import { useState, useEffect } from "react"
import CreateBetSubMarketForm from "./CreateBetSubMarketForm"
import SettleBetSubMarketForm from "./SettleBetSubMarketForm"

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

interface BetSelection {
  betSubMarketId: string
  betOptionId: string
}

interface BetMarketCardProps {
  betMarket: BetMarket
  isOpen: boolean
  isAdmin?: boolean
}

export default function BetMarketCard({
  betMarket,
  isOpen,
  isAdmin = false,
}: BetMarketCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Map<string, Set<string>>>(new Map())

  // Lyt til opdateringer fra bet slip
  useEffect(() => {
    const handleSelectionsUpdate = (event: CustomEvent<BetSelection[]>) => {
      const selections = event.detail
      const newMap = new Map<string, Set<string>>()
      
      // Gruppér selections efter betSubMarketId
      selections.forEach((s) => {
        if (!newMap.has(s.betSubMarketId)) {
          newMap.set(s.betSubMarketId, new Set())
        }
        newMap.get(s.betSubMarketId)!.add(s.betOptionId)
      })
      
      setSelectedOptions(newMap)
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
  }, [])

  const handleOptionClick = (subMarket: BetSubMarket, option: BetOption) => {
    if (!isOpen) return

    const isSubMarketOpen = subMarket.status === "OPEN" && new Date() < new Date(subMarket.closesAt)
    if (!isSubMarketOpen) return

    // Send custom event til BetSlip
    const event = new CustomEvent("addToBetSlip", {
      detail: {
        betSubMarketId: subMarket.id,
        betMarketId: betMarket.id,
        betMarketTitle: `${betMarket.title} - ${subMarket.title}`,
        betOptionId: option.id,
        betOptionLabel: option.label,
        odds: option.odds,
        stakePoints: 10, // Default stake
        potentialPayout: 10 * option.odds,
        allowMultipleBets: subMarket.allowMultipleBets || false,
      },
    })
    window.dispatchEvent(event)
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
          </div>
        </div>
        {betMarket.status === "OPEN" && !isClosed && (
          <div className="mt-2 text-xs text-gray-500">
            Event lukker: {new Date(betMarket.closesAt).toLocaleString("da-DK")}
          </div>
        )}
      </div>

      {/* Bet Sub Markets */}
      <div className="p-3 sm:p-4">
        {isAdmin && isOpen && betMarket.id && (
          <div className="mb-4">
            {(() => {
              // Debug: Log betMarket.id
              if (process.env.NODE_ENV === 'development') {
                console.log("BetMarketCard: Rendering CreateBetSubMarketForm with betMarketId:", betMarket.id)
              }
              return <CreateBetSubMarketForm betMarketId={betMarket.id} />
            })()}
          </div>
        )}

        {betMarket.betSubMarkets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Ingen bets endnu</p>
            {isAdmin && (
              <p className="text-xs mt-1">Klik på "Tilføj Bet" for at oprette et bet</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {betMarket.betSubMarkets.map((subMarket) => {
              const isSubMarketSettled = subMarket.status === "SETTLED"
              const isSubMarketClosed =
                subMarket.status === "CLOSED" || new Date() > new Date(subMarket.closesAt)
              const isSubMarketOpen = subMarket.status === "OPEN" && !isSubMarketClosed
              // Kun én valgt option per sub market
              const selectedOptionIds = selectedOptions.get(subMarket.id) || new Set()
              const selectedOptionId = selectedOptionIds.size > 0 ? Array.from(selectedOptionIds)[0] : null

              return (
                <div
                  key={subMarket.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50"
                >
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {subMarket.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isSubMarketOpen
                            ? "bg-green-100 text-green-800"
                            : isSubMarketSettled
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isSubMarketOpen
                          ? "Åben"
                          : isSubMarketSettled
                          ? "Afgjort"
                          : "Lukket"}
                      </span>
                    </div>
                    {subMarket.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {subMarket.description}
                      </p>
                    )}
                    {isSubMarketOpen && (
                      <p className="text-xs text-gray-500 mt-1">
                        Lukker: {new Date(subMarket.closesAt).toLocaleString("da-DK")}
                      </p>
                    )}
                    {subMarket.settlement && subMarket.settlement.winningOptions.length > 0 && (
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        Vinder(e): {subMarket.settlement.winningOptions.map(wo => wo.betOption.label).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Settlement form for admins */}
                  {isAdmin && !isSubMarketSettled && (
                    <SettleBetSubMarketForm
                      betSubMarketId={subMarket.id}
                      betOptions={subMarket.betOptions}
                      isSettled={isSubMarketSettled}
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subMarket.betOptions.map((option) => {
                      const isWinner =
                        subMarket.settlement?.winningOptions.some(wo => wo.betOption.id === option.id) || false
                      // Hvis flere bets er tilladt, vis alle valgte options, ellers kun én
                      const isSelected = subMarket.allowMultipleBets
                        ? selectedOptionIds.has(option.id)
                        : selectedOptionId === option.id

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionClick(subMarket, option)}
                          disabled={!isSubMarketOpen}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isWinner
                              ? "bg-green-50 border-green-300"
                              : isSelected
                              ? "bg-blue-100 border-blue-500"
                              : isSubMarketOpen
                              ? "border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-medium text-sm ${
                                isWinner
                                  ? "text-green-800"
                                  : isSelected
                                  ? "text-blue-800"
                                  : "text-gray-900"
                              }`}
                            >
                              {option.label}
                              {isSelected && !isWinner && (
                                <span className="ml-2 text-blue-700 font-semibold">
                                  ✓ Valgt
                                </span>
                              )}
                              {isWinner && (
                                <span className="ml-2 text-green-700">✓ Vinder</span>
                              )}
                            </span>
                            <div className="text-right">
                              <span
                                className={`font-bold text-lg ${
                                  isWinner
                                    ? "text-green-700"
                                    : isSelected
                                    ? "text-blue-700"
                                    : isSubMarketOpen
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
