import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Hent brugerens stats
  const userGroups = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const userBetSelections = await prisma.betSelection.findMany({
    where: { userId: session.user.id },
    include: {
      betSubMarket: {
        select: {
          id: true,
          title: true,
          status: true,
          betMarket: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      betOption: {
        select: {
          id: true,
          label: true,
        },
      },
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  })

  const totalGroups = userGroups.length
  const totalBets = await prisma.betSelection.count({
    where: { userId: session.user.id },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-32">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Navn</h2>
            <p className="text-2xl font-bold">{session.user.name}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Email</h2>
            <p className="text-2xl font-bold">{session.user.email}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Stats
            </h2>
            <p className="text-sm text-gray-600">
              {totalGroups} grupper • {totalBets} bets
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Mine Grupper</h2>
          </div>
          {userGroups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Du er ikke medlem af nogen grupper endnu.
            </div>
          ) : (
            <div className="divide-y">
              {userGroups.map((membership) => (
                <a
                  key={membership.id}
                  href={`/groups/${membership.group.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{membership.group.name}</span>
                    {membership.role === "ADMIN" && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Seneste Bets</h2>
          </div>
          {userBetSelections.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Du har ikke placeret nogen bets endnu.
            </div>
          ) : (
            <div className="divide-y">
              {userBetSelections.map((selection) => (
                <a
                  key={selection.id}
                  href={`/bet-markets/${selection.betSubMarket.betMarket.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {selection.betSubMarket.betMarket.title} - {selection.betSubMarket.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {selection.betOption.label} • Stake:{" "}
                        {selection.stakePoints} pts
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selection.betSubMarket.status === "OPEN"
                          ? "bg-green-100 text-green-800"
                          : selection.betSubMarket.status === "SETTLED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selection.betSubMarket.status === "OPEN"
                        ? "Åben"
                        : selection.betSubMarket.status === "SETTLED"
                        ? "Afgjort"
                        : "Lukket"}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

