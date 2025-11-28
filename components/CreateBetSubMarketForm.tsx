"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface CreateBetSubMarketFormProps {
  betMarketId: string
}

export default function CreateBetSubMarketForm({
  betMarketId,
}: CreateBetSubMarketFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  
  // Debug: Log betMarketId
  useEffect(() => {
    if (!betMarketId) {
      console.error("CreateBetSubMarketForm: betMarketId is missing!", betMarketId)
    }
  }, [betMarketId])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [allowMultipleBets, setAllowMultipleBets] = useState(false)
  const [options, setOptions] = useState([
    { label: "", odds: 2.0 },
    { label: "", odds: 2.0 },
  ])

  const addOption = () => {
    setOptions([...options, { label: "", odds: 2.0 }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, field: "label" | "odds", value: string | number) => {
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
    
    // Valider betMarketId - tjek både undefined, null, og tom string
    if (!betMarketId || typeof betMarketId !== 'string' || betMarketId.trim() === '') {
      console.error("betMarketId validation failed in form:", {
        betMarketId,
        type: typeof betMarketId,
        isEmpty: betMarketId?.trim() === ''
      })
      alert("Fejl: BetMarket ID mangler. Prøv at opdatere siden.")
      return
    }
    
    setIsSubmitting(true)

    try {
      const trimmedBetMarketId = betMarketId.trim()
      
      // Final validation
      if (!trimmedBetMarketId) {
        console.error("betMarketId is empty after trim:", betMarketId)
        alert("Fejl: BetMarket ID mangler. Prøv at opdatere siden.")
        setIsSubmitting(false)
        return
      }
      
      // Sikrer at betMarketId er en gyldig string
      if (!trimmedBetMarketId || trimmedBetMarketId.length === 0) {
        throw new Error("betMarketId er påkrævet")
      }
      
      const requestBody = {
        betMarketId: String(trimmedBetMarketId), // Eksplicit konvertering til string
        title: title.trim(),
        description: description.trim() || undefined,
        closesAt: new Date(closesAt).toISOString(),
        allowMultipleBets: allowMultipleBets,
        betOptions: options.filter((opt) => opt.label.trim() !== ""),
      }
      
      // Valider request body før sending
      if (!requestBody.betMarketId || requestBody.betMarketId.trim() === '') {
        throw new Error("betMarketId er påkrævet i request body")
      }
      
      console.log("Creating bet sub market with:", {
        ...requestBody,
        betMarketId: requestBody.betMarketId,
        betMarketIdType: typeof requestBody.betMarketId,
        betMarketIdLength: requestBody.betMarketId.length
      })
      
      // Serialiser og valider JSON
      const jsonBody = JSON.stringify(requestBody)
      const parsedBack = JSON.parse(jsonBody)
      
      if (!parsedBack.betMarketId || parsedBack.betMarketId.trim() === '') {
        throw new Error("betMarketId mangler efter JSON serialisering")
      }
      
      console.log("JSON body:", jsonBody)
      console.log("Parsed back:", parsedBack)
      
      const response = await fetch("/api/bet-sub-markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonBody,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fejl ved oprettelse af bet")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setClosesAt("")
      setAllowMultipleBets(false)
      setOptions([
        { label: "", odds: 2.0 },
        { label: "", odds: 2.0 },
      ])
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Der opstod en fejl")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
      >
        + Tilføj Bet
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Opret nyt Bet</h3>
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
            rows={3}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[80px] sm:min-h-[auto] touch-manipulation"
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
                  className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tillad flere bets per option (spillere kan bette på flere options)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 mb-3 sm:mb-2">
              <input
                type="text"
                placeholder="Option label"
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
                required
                className="flex-1 px-4 py-3 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Odds"
                value={option.odds || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  updateOption(index, "odds", value)
                }}
                onFocus={(e) => {
                  // Når feltet får fokus og værdien er 0, clear det
                  if (e.target.value === '0' || e.target.value === '1') {
                    e.target.value = ''
                  }
                }}
                required
                className="w-28 sm:w-24 px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto] touch-manipulation"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-4 sm:px-3 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 min-w-[48px] min-h-[48px] sm:min-w-[auto] sm:min-h-[auto] touch-manipulation"
                  aria-label="Fjern option"
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
            {isSubmitting ? "Opretter..." : "Opret Bet"}
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

