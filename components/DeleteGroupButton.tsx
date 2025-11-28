"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteGroupButtonProps {
  groupId: string
  groupName: string
}

export default function DeleteGroupButton({
  groupId,
  groupName,
}: DeleteGroupButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    setError("")
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved sletning af gruppe")
        setIsDeleting(false)
        return
      }

      // Redirect til groups liste efter sletning
      router.push("/groups")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
      setIsDeleting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-red-700 transition-colors text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto] shadow-md"
      >
        🗑️ Slet Gruppe
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-4 sm:p-6 mb-4">
      <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Slet Gruppe</h3>
      <p className="text-base sm:text-sm text-gray-700 mb-4 font-medium">
        Er du sikker på, at du vil slette gruppen <strong>"{groupName}"</strong>?
        <br />
        <span className="text-red-700 font-semibold">
          Dette kan ikke fortrydes! Alle bets, points og data i gruppen vil blive slettet.
        </span>
      </p>
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md border-2 border-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto bg-red-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto] shadow-md"
        >
          {isDeleting ? "Sletter..." : "Ja, slet gruppen"}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          disabled={isDeleting}
          className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[auto]"
        >
          Annuller
        </button>
      </div>
    </div>
  )
}

