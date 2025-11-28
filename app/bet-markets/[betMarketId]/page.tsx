import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import BetMarketCard from "@/components/BetMarketCard"
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
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
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
        </div>

        {userScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm">
              <strong>Dine points:</strong> {formatNumber(userScore.totalPoints)}
            </p>
          </div>
        )}

        <div className="mb-8">
          {userScore && (
            <BetMarketCard
              betMarket={{
                id: betMarket.id,
                title: betMarket.title,
                description: betMarket.description,
                status: betMarket.status,
                closesAt: betMarket.closesAt,
                betSubMarkets: betMarket.betSubMarkets.map((sm) => ({
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
              }}
              isOpen={isOpen}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </main>
    </div>
  )
}

