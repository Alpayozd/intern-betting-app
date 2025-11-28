import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  try {
    // Hent brugerens grupper og seneste bet markets
    const groups = await prisma.group.findMany({
    where: {
      memberships: {
        some: {
          userId: session.user.id,
        },
      },
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  })

  const recentBetMarkets = await prisma.betMarket.findMany({
    where: {
      group: {
        memberships: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      betSubMarkets: {
        include: {
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
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  })

    return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Velkommen, {session.user.name}!
          </h1>
          <p className="text-gray-600">
            Dette er en app til interne bets med venner - kun for sjov med
            points! Ingen rigtige penge involveret.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Mine Grupper</h2>
            {groups.length === 0 ? (
              <p className="text-gray-700 mb-4 text-base">
                Du er ikke medlem af nogen grupper endnu.
              </p>
            ) : (
              <ul className="space-y-3">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/groups/${group.id}`}
                      className="text-blue-700 hover:text-blue-900 font-semibold text-base sm:text-lg"
                    >
                      {group.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/groups"
              className="mt-4 inline-block bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base shadow-md"
            >
              Se alle grupper
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Seneste Bet Markets</h2>
            {recentBetMarkets.length === 0 ? (
              <p className="text-gray-700 text-base">
                Ingen bet markets endnu. Opret en gruppe og start at bette!
              </p>
            ) : (
              <ul className="space-y-3">
                {recentBetMarkets.map((market) => (
                  <li key={market.id} className="border-b-2 border-gray-200 pb-3 last:border-0">
                    <Link
                      href={`/bet-markets/${market.id}`}
                      className="block hover:text-blue-700 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 text-base sm:text-lg">{market.title}</div>
                      <div className="text-sm sm:text-base text-gray-700 mt-1">
                        {market.group.name} •{" "}
                        <span
                          className={`font-semibold ${
                            market.status === "OPEN"
                              ? "text-green-700"
                              : market.status === "SETTLED"
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {market.status === "OPEN"
                            ? "Åben"
                            : market.status === "SETTLED"
                            ? "Afgjort"
                            : "Lukket"}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-yellow-600 text-white rounded-lg p-5 sm:p-6 shadow-lg border-2 border-yellow-700">
          <p className="text-base sm:text-lg font-semibold">
            <strong>⚠️ Vigtigt:</strong> Denne app er kun til underholdning.
            Der handles ikke med rigtige penge, og alt sker med virtuelle
            points.
          </p>
        </div>
      </main>
    </div>
    )
  } catch (error: any) {
    console.error("Home page error:", error)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-600 text-white rounded-lg p-5 sm:p-6 shadow-lg border-2 border-red-700">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Fejl</h1>
            <p className="text-base sm:text-lg">
              Der opstod en fejl ved indlæsning af siden. Prøv at opdatere siden.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                {error?.message || String(error)}
              </pre>
            )}
          </div>
        </main>
      </div>
    )
  }
}

