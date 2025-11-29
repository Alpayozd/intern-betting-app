"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface BetOption {
  id: string
  label: string
  odds: number
}

interface EditBetSubMarketFormProps {
  betSubMarketId: string
  initialTitle: string
  initialDescription?: string | null
  initialClosesAt: Date
  initialBetOptions: BetOption[]
  initialAllowMultipleBets: boolean
  isSettled: boolean
}

export default function EditBetSubMarketForm({
  betSubMarketId,
  initialTitle,
  initialDescription,
  initialClosesAt,
  initialBetOptions,
  initialAllowMultipleBets,
  isSettled,
}: EditBetSubMarketFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription || "")
  const [closesAt, setClosesAt] = useState(
    new Date(initialClosesAt).toISOString().slice(0, 16)
  )
  const [allowMultipleBets, setAllowMultipleBets] = useState(initialAllowMultipleBets)
  const [options, setOptions] = useState<Array<{ id: string; label: string; odds: number; oddsDisplay?: string }>>(
    initialBetOptions.map((opt) => ({
      id: opt.id,
      label: opt.label,
      odds: opt.odds,
      oddsDisplay: opt.odds.toString(),
    }))
  )

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription || "")
    setClosesAt(new Date(initialClosesAt).toISOString().slice(0, 16))
    setAllowMultipleBets(initialAllowMultipleBets)
    setOptions(
      initialBetOptions.map((opt) => ({
        id: opt.id,
        label: opt.label,
        odds: opt.odds,
        oddsDisplay: opt.odds.toString(),
      }))
    )
  }, [initialTitle, initialDescription, initialClosesAt, initialBetOptions, initialAllowMultipleBets])

  const addOption = () => {
    setOptions([...options, { id: "", label: "", odds: 2.0, oddsDisplay: "2.0" }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (
    index: number,
    field: "label" | "odds",
    value: string | number
  ) => {
    const updated = [...options]
    if (field === "odds" && typeof value === "string") {
      // Fjern leading zeros for odds
      const cleanValue = value.replace(/^0+/, '') || '1'
      updated[index] = { ...updated[index], [field]: parseFloat(cleanValue) || 1 }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/bet-sub-markets/${betSubMarketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          closesAt: new Date(closesAt).toISOString(),
          allowMultipleBets,
          betOptions: options.filter((opt) => opt.label.trim() !== ""),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fejl ved opdatering af bet")
      }

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Der opstod en fejl")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSettled) {
    return null // Vis ikke form hvis allerede afgjort
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-xs font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
      >
        ✏️ Rediger Bet
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Rediger Bet</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beskrivelse
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lukker *
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            required
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowMultipleBets}
              onChange={(e) => setAllowMultipleBets(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
            />
            <span className="text-sm font-medium text-gray-700">
              Tillad flere bets per option
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options *
          </label>
          {options.map((option, index) => (
            <div key={option.id || index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Option label"
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
                required
                className="flex-1 px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
              />
              <div className="flex items-center border border-gray-300 rounded-md w-28 sm:w-24">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Odds"
                  value={option.oddsDisplay !== undefined ? option.oddsDisplay : (option.odds || '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    updateOption(index, "odds", value)
                  }}
                  onFocus={(e) => {
                    // Når feltet får fokus og værdien er 0, clear det
                    if (e.target.value === '0' || e.target.value === '1' || e.target.value === '1.0') {
                      e.target.value = ''
                    }
                  }}
                  onKeyDown={(e) => {
                    // Tillad piltaster til at justere værdien
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      const current = option.odds || 1
                      const newValue = (current + 0.1).toFixed(1)
                      updateOption(index, "odds", newValue)
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      const current = option.odds || 1
                      if (current > 0.1) {
                        const newValue = (current - 0.1).toFixed(1)
                        updateOption(index, "odds", newValue)
                      }
                    }
                  }}
                  required
                  className="flex-1 px-3 py-3 sm:py-2 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 border-0"
                />
                <div className="flex flex-col border-l border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      const current = option.odds || 1
                      const newValue = (current + 0.1).toFixed(1)
                      updateOption(index, "odds", newValue)
                    }}
                    className="px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation border-b border-gray-300"
                    aria-label="Øg odds"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const current = option.odds || 1
                      if (current > 0.1) {
                        const newValue = (current - 0.1).toFixed(1)
                        updateOption(index, "odds", newValue)
                      }
                    }}
                    className="px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                    aria-label="Reducer odds"
                  >
                    ▼
                  </button>
                </div>
              </div>
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-4 sm:px-3 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 min-w-[48px] min-h-[48px] sm:min-w-[auto] sm:min-h-[auto] touch-manipulation"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Tilføj option
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
          >
            {isSubmitting ? "Opdaterer..." : "Opdater Bet"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
          >
            Annuller
          </button>
        </div>
      </form>
    </div>
  )
}

