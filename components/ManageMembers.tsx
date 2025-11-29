"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  userId: string
  userName: string
  role: "ADMIN" | "MEMBER"
  isCurrentUser: boolean
}

interface ManageMembersProps {
  groupId: string
  members: Member[]
}

export default function ManageMembers({ groupId, members }: ManageMembersProps) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleRemoveMember = async (membershipId: string, userName: string) => {
    if (!confirm(`Er du sikker på, at du vil fjerne ${userName} fra gruppen?`)) {
      return
    }

    setError("")
    setIsRemoving(membershipId)

    try {
      const response = await fetch(`/api/groups/${groupId}/memberships/${membershipId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved fjernelse af medlem")
        setIsRemoving(null)
        return
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
      setIsRemoving(null)
    }
  }

  const handleUpdateRole = async (membershipId: string, newRole: "ADMIN" | "MEMBER") => {
    setError("")
    setIsUpdating(membershipId)

    try {
      const response = await fetch(`/api/groups/${groupId}/memberships/${membershipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fejl ved opdatering af rolle")
        setIsUpdating(null)
        return
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || "Der opstod en fejl")
      setIsUpdating(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200">
      <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Medlemmer</h2>
      </div>
      {error && (
        <div className="p-3 bg-red-600 text-white border-b-2 border-red-700">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {members.map((member) => (
          <div
            key={member.id}
            className={`p-4 sm:p-5 ${
              member.isCurrentUser ? "bg-blue-50 border-l-4 border-blue-600" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {member.userName}
                  {member.isCurrentUser && (
                    <span className="ml-2 text-blue-700 font-bold">(Dig)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleUpdateRole(member.id, e.target.value as "ADMIN" | "MEMBER")
                  }
                  disabled={isUpdating === member.id || member.isCurrentUser}
                  className={`text-xs sm:text-sm px-2 py-1.5 rounded font-semibold border-2 ${
                    member.role === "ADMIN"
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-200 text-gray-700 border-gray-300"
                  } ${
                    isUpdating === member.id || member.isCurrentUser
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <option value="MEMBER">Medlem</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {!member.isCurrentUser && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.userName)}
                    disabled={isRemoving === member.id}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs sm:text-sm font-semibold hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] touch-manipulation"
                    title="Fjern medlem"
                  >
                    {isRemoving === member.id ? "Fjerner..." : "🗑️"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

