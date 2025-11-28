import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CreateBetMarketForm from "@/components/CreateBetMarketForm"
import GroupBetMarkets from "@/components/GroupBetMarkets"
import { formatNumber } from "@/lib/format"

export default async function GroupDetailPage({
  params,
}: {
  params: { groupId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      groupScores: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          totalPoints: "desc",
        },
      },
      betMarkets: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          betOptions: true,
          settlement: {
            include: {
              winningOption: true,
            },
          },
          _count: {
            select: {
              betSelections: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Gruppe ikke fundet
          </div>
        </main>
      </div>
    )
  }

  const membership = group.memberships.find(
    (m) => m.userId === session.user.id
  )

  if (!membership) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Du er ikke medlem af denne gruppe
          </div>
        </main>
      </div>
    )
  }

  const userScore = group.groupScores.find(
    (score) => score.userId === session.user.id
  )

  const isAdmin = membership.role === "ADMIN"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-32">
        <div className="mb-6">
          <Link
            href="/groups"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Tilbage til grupper
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Invite code: <span className="font-mono font-semibold">{group.inviteCode}</span>
          </div>
        </div>

        {userScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm">
              <strong>Dine points:</strong> {formatNumber(userScore.totalPoints)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="lg:col-span-3">
            {isAdmin && (
              <div className="mb-6">
                <CreateBetMarketForm groupId={group.id} />
              </div>
            )}

            {userScore && (
              <GroupBetMarkets
                betMarkets={group.betMarkets.map((m) => ({
                  id: m.id,
                  title: m.title,
                  description: m.description,
                  status: m.status,
                  closesAt: m.closesAt,
                  betOptions: m.betOptions,
                  settlement: m.settlement,
                }))}
                userPoints={userScore.totalPoints}
                groupId={group.id}
              />
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Leaderboard</h2>
              </div>
              <div className="divide-y">
                {group.groupScores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`p-4 ${
                      score.userId === session.user.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-semibold text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <span className="font-medium">
                          {score.user.name}
                          {score.userId === session.user.id && (
                            <span className="ml-2 text-blue-600">(Dig)</span>
                          )}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {formatNumber(score.totalPoints)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Medlemmer</h2>
              </div>
              <div className="divide-y">
                {group.memberships.map((membership) => (
                  <div key={membership.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <span>{membership.user.name}</span>
                      {membership.role === "ADMIN" && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

