"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface EditGroupFormProps {
  groupId: string
  initialName: string
  initialDescription?: string | null
}

export default function EditGroupForm({
  groupId,
  initialName,
  initialDescription,
}: EditGroupFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription || "")
  const [error, setError] = useState("")

  useEffect(() => {
    setName(initialName)
    setDescription(initialDescription || "")
  }, [initialName, initialDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved opdatering af gruppe")
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto] shadow-md"
      >
        ✏️ Rediger Gruppe
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Rediger Gruppe</h3>
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md border-2 border-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
            Gruppens navn *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
          />
        </div>

        <div>
          <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
            Beskrivelse
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[auto]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto] shadow-md"
          >
            {isSubmitting ? "Opdaterer..." : "Opdater Gruppe"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto]"
          >
            Annuller
          </button>
        </div>
      </form>
    </div>
  )
}

