"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteBetMarketButtonProps {
  betMarketId: string
  betMarketTitle: string
  isSettled: boolean
  groupId: string
}

export default function DeleteBetMarketButton({
  betMarketId,
  betMarketTitle,
  isSettled,
  groupId,
}: DeleteBetMarketButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    setError("")
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/bet-markets/${betMarketId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved sletning af bet market")
        setIsDeleting(false)
        return
      }

      // Redirect til gruppe siden efter sletning
      router.push(`/groups/${groupId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
      setIsDeleting(false)
    }
  }

  if (isSettled) {
    return null // Vis ikke knap hvis allerede afgjort
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-red-600 text-white px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm sm:text-xs font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
      >
        🗑️ Slet Bet Market
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-red-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg font-bold text-red-900 mb-2">Slet Bet Market</h3>
      <p className="text-sm text-gray-700 mb-4 font-medium">
        Er du sikker på, at du vil slette bet market <strong>"{betMarketTitle}"</strong>?
        <br />
        <span className="text-red-700 font-semibold">
          Dette kan ikke fortrydes! Alle bets, sub markets og data for dette bet market vil blive slettet.
        </span>
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
        >
          {isDeleting ? "Sletter..." : "Ja, slet bet market"}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          disabled={isDeleting}
          className="bg-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[auto] touch-manipulation"
        >
          Annuller
        </button>
      </div>
    </div>
  )
}

