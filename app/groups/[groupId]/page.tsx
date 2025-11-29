import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CreateBetMarketForm from "@/components/CreateBetMarketForm"
import GroupBetMarkets from "@/components/GroupBetMarkets"
import EditGroupForm from "@/components/EditGroupForm"
import DeleteGroupButton from "@/components/DeleteGroupButton"
import ManageMembers from "@/components/ManageMembers"
import AutoRefreshWrapper from "@/components/AutoRefreshWrapper"
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
          betSubMarkets: {
            include: {
              betOptions: {
                include: {
                  _count: {
                    select: {
                      betSelections: true,
                    },
                  },
                },
              },
              settlement: {
                include: {
                  winningOptions: {
                    include: {
                      betOption: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
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
    <AutoRefreshWrapper interval={5000} enabled={true}>
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
          <div className="mt-2 text-sm sm:text-base text-gray-700 font-medium">
            Invite code: <span className="font-mono font-bold text-gray-900">{group.inviteCode}</span>
          </div>
          {isAdmin && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <EditGroupForm
                groupId={group.id}
                initialName={group.name}
                initialDescription={group.description}
              />
              <DeleteGroupButton
                groupId={group.id}
                groupName={group.name}
              />
            </div>
          )}
        </div>

        {userScore && (
          <div className="bg-blue-600 text-white rounded-lg p-4 sm:p-5 mb-6 shadow-md">
            <p className="text-base sm:text-lg font-semibold">
              <span className="opacity-90">Dine points:</span>{" "}
              <span className="text-2xl sm:text-3xl font-bold">
                {formatNumber(userScore.totalPoints)}
              </span>
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
                  betSubMarkets: m.betSubMarkets.map((sm) => ({
                    id: sm.id,
                    title: sm.title,
                    description: sm.description,
                    status: sm.status,
                    closesAt: sm.closesAt,
                    allowMultipleBets: sm.allowMultipleBets,
                    betOptions: sm.betOptions.map((opt) => ({
                      id: opt.id,
                      label: opt.label,
                      odds: opt.odds,
                      _count: opt._count,
                    })),
                    settlement: sm.settlement,
                  })),
                }))}
                userPoints={userScore.totalPoints}
                groupId={group.id}
                isAdmin={isAdmin}
              />
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200">
              <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Leaderboard</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {group.groupScores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`p-4 sm:p-5 ${
                      score.userId === session.user.id
                        ? "bg-blue-100 border-l-4 border-blue-600"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg sm:text-xl font-bold text-gray-700 w-8">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {score.user.name}
                          {score.userId === session.user.id && (
                            <span className="ml-2 text-blue-700 font-bold">(Dig)</span>
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm sm:text-base">
                        {formatNumber(score.totalPoints)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin ? (
              <ManageMembers
                groupId={group.id}
                members={group.memberships.map((membership) => ({
                  id: membership.id,
                  userId: membership.userId,
                  userName: membership.user.name,
                  role: membership.role,
                  isCurrentUser: membership.userId === session.user.id,
                }))}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200">
                <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Medlemmer</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {group.memberships.map((membership) => (
                    <div key={membership.id} className="p-4 sm:p-5 bg-white">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 text-sm sm:text-base">{membership.user.name}</span>
                        {membership.role === "ADMIN" && (
                          <span className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-semibold">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </AutoRefreshWrapper>
  )
}


