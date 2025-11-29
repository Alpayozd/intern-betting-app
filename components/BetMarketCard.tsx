"use client"

import { useState, useEffect } from "react"
import CreateBetSubMarketForm from "./CreateBetSubMarketForm"
import SettleBetSubMarketForm from "./SettleBetSubMarketForm"
import EditBetSubMarketForm from "./EditBetSubMarketForm"
import BetDetailsModal from "./BetDetailsModal"

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
  createdByUserId?: string
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
    if (!isOpen) {
      console.log('Bet market is not open')
      return
    }

    const isSubMarketOpen = subMarket.status === "OPEN" && new Date() < new Date(subMarket.closesAt)
    if (!isSubMarketOpen) {
      console.log('Sub market is not open:', {
        status: subMarket.status,
        closesAt: subMarket.closesAt,
        now: new Date()
      })
      return
    }

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
    console.log('Bet option clicked:', option.label)
  }

  const isSettled = betMarket.status === "SETTLED"
  const isClosed = betMarket.status === "CLOSED" || new Date() > new Date(betMarket.closesAt)

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 mb-4">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b-2 border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              {betMarket.title}
            </h3>
            {betMarket.description && (
              <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">
                {betMarket.description}
              </p>
            )}
          </div>
          <div className="sm:ml-4 sm:text-right">
            <span
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                betMarket.status === "OPEN" && !isClosed
                  ? "bg-green-600 text-white"
                  : betMarket.status === "SETTLED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-600 text-white"
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
          <div className="mt-2 text-xs sm:text-sm text-gray-700 font-medium">
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
          <div className="text-center text-gray-700 py-8">
            <p className="text-base sm:text-sm font-medium">Ingen bets endnu</p>
            {isAdmin && (
              <p className="text-sm sm:text-xs mt-1 font-medium">Klik på "Tilføj Bet" for at oprette et bet</p>
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
                  className="border-2 border-gray-300 rounded-lg p-3 sm:p-4 bg-gray-50"
                >
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {subMarket.title}
                      </h4>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                          isSubMarketOpen
                            ? "bg-green-600 text-white"
                            : isSubMarketSettled
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-white"
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
                      <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">
                        {subMarket.description}
                      </p>
                    )}
                    {isSubMarketOpen && (
                      <p className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">
                        Lukker: {new Date(subMarket.closesAt).toLocaleString("da-DK")}
                      </p>
                    )}
                    {subMarket.settlement && subMarket.settlement.winningOptions && subMarket.settlement.winningOptions.length > 0 && (
                      <p className="text-xs sm:text-sm text-green-700 mt-1 font-bold">
                        Vinder(e): {subMarket.settlement.winningOptions.map(wo => wo.betOption.label).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="mb-3 space-y-2">
                      {!isSubMarketSettled && (
                        <>
                          <EditBetSubMarketForm
                            betSubMarketId={subMarket.id}
                            initialTitle={subMarket.title}
                            initialDescription={subMarket.description}
                            initialClosesAt={subMarket.closesAt}
                            initialBetOptions={subMarket.betOptions}
                            initialAllowMultipleBets={subMarket.allowMultipleBets || false}
                            isSettled={isSubMarketSettled}
                          />
                          <SettleBetSubMarketForm
                            betSubMarketId={subMarket.id}
                            betOptions={subMarket.betOptions}
                            isSettled={isSubMarketSettled}
                          />
                        </>
                      )}
                      {/* Vis bettingmuligheder for admin */}
                      {subMarket.betOptions && subMarket.betOptions.length > 0 && (
                        <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-xs sm:text-sm font-bold text-blue-900">
                              Bettingmuligheder (Admin Oversigt)
                            </h5>
                            <button
                              onClick={() => setOpenBetDetails({ subMarketId: subMarket.id, title: subMarket.title })}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold min-h-[28px] touch-manipulation"
                            >
                              Se alle bets
                            </button>
                          </div>
                          <div className="space-y-1">
                            {subMarket.betOptions.map((option) => (
                              <div
                                key={option.id}
                                className="flex justify-between items-center text-xs sm:text-sm"
                              >
                                <span className="text-gray-900 font-semibold">{option.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-blue-800">
                                    Odds: {option.odds.toFixed(2)}
                                  </span>
                                  {option._count && (
                                    <span className="text-gray-700 font-medium">
                                      ({option._count.betSelections} bets)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subMarket.betOptions.map((option) => {
                      const isWinner =
                        subMarket.settlement?.winningOptions?.some(wo => wo.betOption.id === option.id) || false
                      // Hvis flere bets er tilladt, vis alle valgte options, ellers kun én
                      const isSelected = subMarket.allowMultipleBets
                        ? selectedOptionIds.has(option.id)
                        : selectedOptionId === option.id

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionClick(subMarket, option)}
                          disabled={!isSubMarketOpen}
                          className={`p-4 sm:p-3 rounded-lg border-2 transition-all text-left min-h-[64px] sm:min-h-[auto] touch-manipulation ${
                            isWinner
                              ? "bg-green-50 border-green-300 active:bg-green-100"
                              : isSelected
                              ? "bg-blue-100 border-blue-500 active:bg-blue-200"
                              : isSubMarketOpen
                              ? "border-gray-300 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-medium text-base sm:text-sm ${
                                isWinner
                                  ? "text-green-800"
                                  : isSelected
                                  ? "text-blue-800"
                                  : "text-gray-900"
                              }`}
                            >
                              {option.label}
                              {isSelected && !isWinner && (
                                <span className="ml-2 text-blue-700 font-semibold text-sm">
                                  ✓ Valgt
                                </span>
                              )}
                              {isWinner && (
                                <span className="ml-2 text-green-700 text-sm">✓ Vinder</span>
                              )}
                            </span>
                            <div className="text-right">
                              <span
                                className={`font-bold text-xl sm:text-lg ${
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
                              {isAdmin && option._count && (
                                <div className="text-xs sm:text-sm text-gray-700 mt-1 font-medium">
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
