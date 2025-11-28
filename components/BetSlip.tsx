"use client"

import { useState, useEffect } from "react"
import { formatNumber } from "@/lib/format"

interface BetSelection {
  betSubMarketId: string
  betMarketId: string
  betMarketTitle: string
  betOptionId: string
  betOptionLabel: string
  odds: number
  stakePoints: number
  potentialPayout: number
  allowMultipleBets?: boolean // Om flere bets er tilladt for dette BetSubMarket
}

interface BetSlipProps {
  userPoints: number
  onPlaceBets: (selections: BetSelection[]) => Promise<void>
}

export default function BetSlip({ userPoints, onPlaceBets }: BetSlipProps) {
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)

  // Expose selections til andre komponenter via custom event
  useEffect(() => {
    const event = new CustomEvent("betSlipSelectionsUpdated", {
      detail: selections,
    })
    window.dispatchEvent(event)
  }, [selections])

  // Lyt til custom events for at tilføje bets til slip
  useEffect(() => {
    const handleAddBet = (event: CustomEvent<BetSelection>) => {
      const newSelection = event.detail
      setSelections((prev) => {
        // Tjek om der allerede er en bet fra samme BetSubMarket
        const existingFromSameSubMarket = prev.find(
          (s) => s.betSubMarketId === newSelection.betSubMarketId
        )
        
        // Hvis flere bets er tilladt (allowMultipleBets = true)
        if (newSelection.allowMultipleBets) {
          // Tjek om den samme option allerede findes
          const sameOption = prev.find(
            (s) =>
              s.betSubMarketId === newSelection.betSubMarketId &&
              s.betOptionId === newSelection.betOptionId
          )
          
          // Hvis samme option, fjern den (toggle off)
          if (sameOption) {
            return prev.filter(
              (s) =>
                !(s.betSubMarketId === newSelection.betSubMarketId &&
                  s.betOptionId === newSelection.betOptionId)
            )
          }
          
          // Tilføj den nye selection (tillader flere options fra samme market)
          return [...prev, newSelection]
        }
        
        // Hvis flere bets IKKE er tilladt (standard opførsel)
        if (existingFromSameSubMarket) {
          // Hvis det er den samme option, fjern den (toggle off)
          if (existingFromSameSubMarket.betOptionId === newSelection.betOptionId) {
            return prev.filter(
              (s) => s.betSubMarketId !== newSelection.betSubMarketId
            )
          }
          // Hvis det er en anden option, erstatt den gamle med den nye
          return prev.map((s) =>
            s.betSubMarketId === newSelection.betSubMarketId
              ? newSelection
              : s
          )
        }
        
        // Hvis der ikke er nogen bet fra dette sub market, tilføj den nye
        return [...prev, newSelection]
      })
      setIsOpen(true)
    }

    window.addEventListener("addToBetSlip" as any, handleAddBet as EventListener)
    return () => {
      window.removeEventListener(
        "addToBetSlip" as any,
        handleAddBet as EventListener
      )
    }
  }, [])

  // Lyt til klik udenfor bet slip'en for at minimere den
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Tjek om klikket er udenfor bet slip'en
      const betSlipElement = document.querySelector('[data-bet-slip]')
      if (betSlipElement && !betSlipElement.contains(target)) {
        // Tjek om klikket ikke er på "Bet Slip" knappen
        const betSlipButton = target.closest('button[data-bet-slip-button]')
        if (!betSlipButton) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const removeSelection = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStake = (index: number, stake: number) => {
    if (stake < 0) return
    setSelections((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        stakePoints: stake,
        potentialPayout: stake * updated[index].odds,
      }
      return updated
    })
  }

  const totalStake = selections.reduce((sum, s) => sum + s.stakePoints, 0)
  const totalPotentialPayout = selections.reduce(
    (sum, s) => sum + s.potentialPayout,
    0
  )

  const handlePlaceBets = async () => {
    if (totalStake > userPoints) {
      alert(`Du har kun ${userPoints} points tilgængelige`)
      return
    }

    if (selections.length === 0) {
      alert("Tilføj mindst ét bet til slip'en")
      return
    }

    setIsPlacing(true)
    try {
      await onPlaceBets(selections)
      setSelections([])
      setIsOpen(false)
    } catch (error) {
      console.error("Error placing bets:", error)
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          data-bet-slip-button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center gap-2 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Bet Slip</span>
          <span className="sm:hidden">Slip</span>
          {selections.length > 0 && (
            <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">
              {selections.length}
            </span>
          )}
        </button>
      )}
      <div
        data-bet-slip
        className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 transition-transform duration-300 max-h-[50vh] sm:max-h-[50vh] ${
          isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-3 sm:px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold">Bet Slip</h2>
            <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">
              {selections.length} bet{selections.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-xs hidden sm:block">
              <span className="opacity-80">Points:</span>{" "}
              <span className="font-bold">{formatNumber(userPoints)}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center"
              title="Minimer"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(50vh-120px)]">
          {selections.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm mb-1">Ingen bets i slip'en</p>
              <p className="text-xs">
                Vælg en option fra bet markets ovenfor
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {selections.map((selection, index) => (
                <div key={`${selection.betSubMarketId}-${selection.betOptionId}-${index}`} className="p-2 sm:p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-xs text-gray-900 truncate">
                        {selection.betMarketTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {selection.betOptionLabel} @ {selection.odds.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSelection(index)}
                      className="text-red-600 hover:text-red-800 ml-2 text-lg flex-shrink-0"
                      title="Fjern"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-xs text-gray-700">Stake:</label>
                      <input
                        type="number"
                        min="1"
                        max={userPoints}
                        value={selection.stakePoints}
                        onChange={(e) =>
                          updateStake(index, parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                      <span className="text-xs text-gray-600">pts</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 sm:ml-auto">
                      Gevinst: {selection.potentialPayout.toFixed(0)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selections.length > 0 && (
          <div className="bg-gray-50 border-t px-3 sm:px-4 py-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-gray-600">Total Stake</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {formatNumber(totalStake)} pts
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Potentiel Gevinst</p>
                <p className="text-base sm:text-lg font-bold text-green-600">
                  {totalPotentialPayout.toFixed(0)} pts
                </p>
              </div>
            </div>
            <button
              onClick={handlePlaceBets}
              disabled={
                isPlacing ||
                totalStake === 0 ||
                totalStake > userPoints ||
                selections.length === 0
              }
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacing
                ? "Placerer bets..."
                : `Placér ${selections.length} bet${selections.length !== 1 ? "s" : ""}`}
            </button>
            {totalStake > userPoints && (
              <p className="text-red-600 text-xs mt-2 text-center">
                Utilstrækkelige points
              </p>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

