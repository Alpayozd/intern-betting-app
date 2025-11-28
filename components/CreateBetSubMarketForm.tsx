"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface CreateBetSubMarketFormProps {
  betMarketId: string
}

export default function CreateBetSubMarketForm({
  betMarketId,
}: CreateBetSubMarketFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [closesAt, setClosesAt] = useState("")
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
    updated[index] = { ...updated[index], [field]: value }
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bet-sub-markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          betMarketId,
          title,
          description,
          closesAt: new Date(closesAt).toISOString(),
          betOptions: options.filter((opt) => opt.label.trim() !== ""),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fejl ved oprettelse af bet")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setClosesAt("")
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options *
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Option label"
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Odds"
                value={option.odds}
                onChange={(e) =>
                  updateOption(index, "odds", parseFloat(e.target.value) || 1)
                }
                required
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Opretter..." : "Opret Bet"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Annuller
          </button>
        </div>
      </form>
    </div>
  )
}

