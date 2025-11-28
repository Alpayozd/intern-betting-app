import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import SettleBetMarketForm from "@/components/SettleBetMarketForm"
import SingleBetMarket from "@/components/SingleBetMarket"
import { formatNumber } from "@/lib/format"

export default async function BetMarketDetailPage({
  params,
}: {
  params: { betMarketId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const betMarket = await prisma.betMarket.findUnique({
    where: { id: params.betMarketId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      betOptions: {
        include: {
          _count: {
            select: {
              betSelections: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      betSelections: {
        where: {
          userId: session.user.id,
        },
        include: {
          betOption: true,
        },
      },
      settlement: {
        include: {
          winningOption: true,
          settledBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!betMarket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Bet market ikke fundet
          </div>
        </main>
      </div>
    )
  }

  // Tjek om brugeren er medlem af gruppen
  const membership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId: betMarket.groupId,
        userId: session.user.id,
      },
    },
  })

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

  const isAdmin = membership.role === "ADMIN"
  const isOpen = betMarket.status === "OPEN" && new Date() < betMarket.closesAt
  const userScore = await prisma.groupScore.findUnique({
    where: {
      groupId_userId: {
        groupId: betMarket.groupId,
        userId: session.user.id,
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-32">
        <div className="mb-6">
          <Link
            href={`/groups/${betMarket.group.id}`}
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Tilbage til {betMarket.group.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{betMarket.title}</h1>
          {betMarket.description && (
            <p className="text-gray-600 mt-2">{betMarket.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                betMarket.status === "OPEN"
                  ? "bg-green-100 text-green-800"
                  : betMarket.status === "SETTLED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {betMarket.status === "OPEN"
                ? "Åben"
                : betMarket.status === "SETTLED"
                ? "Afgjort"
                : "Lukket"}
            </span>
            <span className="text-sm text-gray-600">
              Lukker: {new Date(betMarket.closesAt).toLocaleString("da-DK")}
            </span>
          </div>
          {betMarket.settlement && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Vinder:</strong> {betMarket.settlement.winningOption.label} • Afgjort af{" "}
                {betMarket.settlement.settledBy.name} den{" "}
                {new Date(betMarket.settlement.settledAt).toLocaleString("da-DK")}
              </p>
            </div>
          )}
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
            {userScore && (
              <SingleBetMarket
                betMarket={{
                  id: betMarket.id,
                  title: betMarket.title,
                  description: betMarket.description,
                  status: betMarket.status,
                  closesAt: betMarket.closesAt,
                  betOptions: betMarket.betOptions.map((opt) => ({
                    id: opt.id,
                    label: opt.label,
                    odds: opt.odds,
                    _count: opt._count,
                  })),
                  settlement: betMarket.settlement,
                }}
                userPoints={userScore.totalPoints}
                groupId={betMarket.groupId}
              />
            )}

            {betMarket.betSelections.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Dine Bets</h2>
                <div className="space-y-3">
                  {betMarket.betSelections.map((selection) => {
                    const isWinner =
                      betMarket.settlement?.winningOptionId ===
                      selection.betOptionId
                    return (
                      <div
                        key={selection.id}
                        className={`border rounded-lg p-4 ${
                          isWinner ? "bg-green-50 border-green-300" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {selection.betOption.label}
                            </span>
                            {isWinner && (
                              <span className="ml-2 text-green-700 font-semibold">
                                ✓ Vinder
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div>
                              Stake: {selection.stakePoints} pts
                            </div>
                            <div className="text-sm text-gray-600">
                              Potentiel gevinst:{" "}
                              {selection.potentialPayoutPoints.toFixed(0)} pts
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            {isAdmin &&
              betMarket.status !== "SETTLED" &&
              !isOpen &&
              betMarket.betOptions.length > 0 && (
                <SettleBetMarketForm
                  betMarketId={betMarket.id}
                  betOptions={betMarket.betOptions}
                />
              )}
          </div>
        </div>
      </main>
    </div>
  )
}

