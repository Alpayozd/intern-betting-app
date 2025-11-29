"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface EditBetMarketFormProps {
  betMarketId: string
  initialTitle: string
  initialDescription?: string | null
  initialClosesAt: Date
  isSettled: boolean
}

export default function EditBetMarketForm({
  betMarketId,
  initialTitle,
  initialDescription,
  initialClosesAt,
  isSettled,
}: EditBetMarketFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription || "")
  const [closesAt, setClosesAt] = useState(
    new Date(initialClosesAt).toISOString().slice(0, 16)
  )

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription || "")
    setClosesAt(new Date(initialClosesAt).toISOString().slice(0, 16))
  }, [initialTitle, initialDescription, initialClosesAt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/bet-markets/${betMarketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          closesAt: new Date(closesAt).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fejl ved opdatering af bet market")
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
        ✏️ Rediger Bet Market
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Rediger Bet Market</h3>
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
          >
            {isSubmitting ? "Opdaterer..." : "Opdater Bet Market"}
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

