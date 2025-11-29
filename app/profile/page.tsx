import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import NotificationSettings from "@/components/NotificationSettings"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Navn</h2>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{session.user.name}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Email</h2>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all">{session.user.email}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Stats
            </h2>
            <p className="text-base sm:text-lg text-gray-700 font-semibold">
              {totalGroups} grupper • {totalBets} bets
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 mb-6">
          <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mine Grupper</h2>
          </div>
          {userGroups.length === 0 ? (
            <div className="p-6 text-center text-gray-700 text-base font-medium">
              Du er ikke medlem af nogen grupper endnu.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userGroups.map((membership) => (
                <a
                  key={membership.id}
                  href={`/groups/${membership.group.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors bg-white"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 text-base sm:text-lg">{membership.group.name}</span>
                    {membership.role === "ADMIN" && (
                      <span className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <NotificationSettings />
        </div>

        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200">
          <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Seneste Bets</h2>
          </div>
          {userBetSelections.length === 0 ? (
            <div className="p-6 text-center text-gray-700 text-base font-medium">
              Du har ikke placeret nogen bets endnu.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userBetSelections.map((selection) => (
                <a
                  key={selection.id}
                  href={`/bet-markets/${selection.betSubMarket.betMarket.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900 text-base sm:text-lg">
                        {selection.betSubMarket.betMarket.title} - {selection.betSubMarket.title}
                      </div>
                      <div className="text-sm sm:text-base text-gray-700 mt-1 font-medium">
                        {selection.betOption.label} • Stake:{" "}
                        {selection.stakePoints} pts
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                        selection.betSubMarket.status === "OPEN"
                          ? "bg-green-600 text-white"
                          : selection.betSubMarket.status === "SETTLED"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-white"
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

