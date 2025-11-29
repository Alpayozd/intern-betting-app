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

  // Tillad scrolling på baggrunden når BetSlip er åbent
  useEffect(() => {
    // Fjern body overflow lock - tillad scrolling
    document.body.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const removeSelection = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index))
  }

  const updateStake = (index: number, value: string) => {
    // Tillad decimaler - fjern alt undtagen tal og decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '')
    // Tillad kun ét decimal point
    const parts = cleanValue.split('.')
    const finalValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleanValue
    
    const stake = parseFloat(finalValue) || 0
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

  const totalStake = selections.reduce((sum, s) => sum + (s.stakePoints || 0), 0)
  const totalPotentialPayout = selections.reduce(
    (sum, s) => sum + (s.potentialPayout || 0),
    0
  )

  const handlePlaceBets = async () => {
    // Valider at alle selections har en gyldig stake
    const invalidSelections = selections.filter(s => !s.stakePoints || s.stakePoints <= 0)
    if (invalidSelections.length > 0) {
      alert("Alle bets skal have en stake større end 0")
      return
    }

    // Runder stake til nærmeste heltal (points er hele tal)
    const roundedSelections = selections.map(s => ({
      ...s,
      stakePoints: Math.round(s.stakePoints),
      potentialPayout: Math.round(s.stakePoints) * s.odds,
    }))

    if (totalStake > userPoints) {
      alert(`Du har kun ${userPoints} points tilgængelige`)
      return
    }

    if (selections.length === 0) {
      alert("Tilføj mindst ét bet til slip'en")
      return
    }

    if (totalStake === 0) {
      alert("Total stake skal være større end 0")
      return
    }

    setIsPlacing(true)
    try {
      await onPlaceBets(roundedSelections)
      setSelections([])
      setIsOpen(false)
    } catch (error: any) {
      console.error("Error placing bets:", error)
      alert(error?.message || "Der opstod en fejl ved placering af bets")
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
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-4 rounded-full shadow-2xl hover:bg-blue-700 active:bg-blue-800 transition-colors z-[9999] flex items-center justify-center gap-2 text-base font-bold min-h-[64px] min-w-[64px] touch-manipulation"
          style={{ 
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}
          aria-label="Åbn bet slip"
        >
          <span className="hidden sm:inline">Bet Slip</span>
          <span className="sm:hidden text-lg">📋</span>
          {selections.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center">
              {selections.length}
            </span>
          )}
        </button>
      )}
      <div
        data-bet-slip
        className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-[10000] transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          maxHeight: selections.length > 0 ? '28vh' : '20vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Fixed */}
        <div className="bg-blue-600 text-white px-2 py-1.5 flex justify-between items-center flex-shrink-0 border-b border-blue-700">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold">Bet Slip</h2>
            <span className="bg-blue-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {selections.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="text-xs">
              <span className="opacity-80">P:</span>{" "}
              <span className="font-bold">{formatNumber(userPoints)}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 active:text-gray-300 text-base font-bold w-7 h-7 flex items-center justify-center touch-manipulation"
              title="Minimer"
              aria-label="Luk bet slip"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(28vh - 90px)' }}>
          {selections.length === 0 ? (
            <div className="p-2 text-center text-gray-500">
              <p className="text-xs">Ingen bets</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {selections.map((selection, index) => (
                <div key={`${selection.betSubMarketId}-${selection.betOptionId}-${index}`} className="p-1.5 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-gray-900 line-clamp-1">
                        {selection.betMarketTitle}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {selection.betOptionLabel} @ {selection.odds.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSelection(index)}
                      className="text-red-600 hover:text-red-800 active:text-red-900 text-lg font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center touch-manipulation"
                      title="Fjern"
                      aria-label="Fjern bet"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <label className="text-xs text-gray-700 whitespace-nowrap">S:</label>
                    <div className="flex items-center border border-gray-300 rounded">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={selection.stakePoints || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          // Tillad kun ét decimal point
                          const parts = value.split('.')
                          const finalValue = parts.length > 2 
                            ? parts[0] + '.' + parts.slice(1).join('')
                            : value
                          updateStake(index, finalValue)
                        }}
                        onFocus={(e) => {
                          if (e.target.value === '0' || e.target.value === '0.0') {
                            e.target.value = ''
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '' || parseFloat(e.target.value) === 0) {
                            updateStake(index, '10')
                          }
                        }}
                        onKeyDown={(e) => {
                          // Tillad piltaster til at justere værdien
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            const current = parseFloat(selection.stakePoints?.toString() || '0') || 0
                            updateStake(index, (current + 0.1).toString())
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            const current = parseFloat(selection.stakePoints?.toString() || '0') || 0
                            if (current > 0.1) {
                              updateStake(index, (current - 0.1).toString())
                            }
                          }
                        }}
                        className="w-14 px-1.5 py-0.5 text-xs min-h-[28px] touch-manipulation focus:outline-none border-0"
                      />
                      <div className="flex flex-col border-l border-gray-300">
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(selection.stakePoints?.toString() || '0') || 0
                            updateStake(index, (current + 0.1).toString())
                          }}
                          className="px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation border-b border-gray-300"
                          aria-label="Øg stake"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = parseFloat(selection.stakePoints?.toString() || '0') || 0
                            if (current > 0.1) {
                              updateStake(index, (current - 0.1).toString())
                            }
                          }}
                          className="px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                          aria-label="Reducer stake"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">pts</span>
                    <span className="text-xs font-semibold text-blue-600 ml-auto">
                      {selection.potentialPayout.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {selections.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-300 px-2 py-1.5 flex-shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <div>
                <p className="text-xs text-gray-600">Stake:</p>
                <p className="text-xs font-bold text-gray-900">
                  {formatNumber(totalStake)} pts
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Gevinst:</p>
                <p className="text-xs font-bold text-green-600">
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
                selections.length === 0 ||
                selections.some(s => !s.stakePoints || s.stakePoints <= 0)
              }
              className="w-full bg-green-600 text-white py-1.5 px-2 rounded-lg font-semibold text-xs hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] touch-manipulation"
            >
              {isPlacing
                ? "Placerer..."
                : `Placér ${selections.length} (${formatNumber(totalStake)} pts)`}
            </button>
            {totalStake > userPoints && (
              <p className="text-red-600 text-xs mt-0.5 text-center">
                Utilstrækkelige points
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

