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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Mine Grupper</h2>
            {groups.length === 0 ? (
              <p className="text-gray-500 mb-4">
                Du er ikke medlem af nogen grupper endnu.
              </p>
            ) : (
              <ul className="space-y-2">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/groups/${group.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {group.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/groups"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Se alle grupper
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Seneste Bet Markets</h2>
            {recentBetMarkets.length === 0 ? (
              <p className="text-gray-500">
                Ingen bet markets endnu. Opret en gruppe og start at bette!
              </p>
            ) : (
              <ul className="space-y-3">
                {recentBetMarkets.map((market) => (
                  <li key={market.id} className="border-b pb-3 last:border-0">
                    <Link
                      href={`/bet-markets/${market.id}`}
                      className="block hover:text-blue-600 transition-colors"
                    >
                      <div className="font-medium">{market.title}</div>
                      <div className="text-sm text-gray-500">
                        {market.group.name} •{" "}
                        <span
                          className={
                            market.status === "OPEN"
                              ? "text-green-600"
                              : market.status === "SETTLED"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h1 className="text-xl font-bold text-red-800 mb-2">Fejl</h1>
            <p className="text-red-600">
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

