"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface BetOption {
  label: string
  odds: number
}

export default function CreateBetMarketForm({
  groupId,
}: {
  groupId: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [options, setOptions] = useState<BetOption[]>([
    { label: "", odds: 1.5 },
    { label: "", odds: 1.5 },
  ])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const addOption = () => {
    setOptions([...options, { label: "", odds: 1.5 }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, field: keyof BetOption, value: string | number) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validering
    if (!title.trim()) {
      setError("Titel er påkrævet")
      return
    }

    if (options.some((opt) => !opt.label.trim())) {
      setError("Alle options skal have et label")
      return
    }

    if (options.some((opt) => opt.odds <= 0)) {
      setError("Alle odds skal være positive")
      return
    }

    if (!closesAt) {
      setError("Lukketidspunkt er påkrævet")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/bet-markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          title,
          description,
          closesAt: new Date(closesAt).toISOString(),
          options,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Der opstod en fejl")
        return
      }

      router.push(`/bet-markets/${data.betMarket.id}`)
      router.refresh()
    } catch (err) {
      setError("Der opstod en fejl")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Opret Nyt Bet Market</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Titel *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Fx: Hvem spiser flest stykker sushi?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Beskrivelse (valgfri)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Regler og detaljer..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="closesAt"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Lukker klokken *
          </label>
          <input
            id="closesAt"
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Options *
            </label>
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Tilføj option
            </button>
          </div>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) =>
                      updateOption(index, "label", e.target.value)
                    }
                    placeholder="Label (fx: Alpay)"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={option.odds}
                    onChange={(e) =>
                      updateOption(index, "odds", parseFloat(e.target.value) || 0)
                    }
                    placeholder="Odds"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Opretter..." : "Opret Bet Market"}
        </button>
      </form>
    </div>
  )
}

