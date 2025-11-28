import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CreateGroupForm from "@/components/CreateGroupForm"
import JoinGroupForm from "@/components/JoinGroupForm"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const groups = await prisma.group.findMany({
    where: {
      memberships: {
        some: {
          userId: session.user.id,
        },
      },
    },
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
      _count: {
        select: {
          betMarkets: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mine Grupper</h1>
          <p className="text-gray-600">
            Opret eller join en gruppe for at starte med at bette
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <CreateGroupForm />
          <JoinGroupForm />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Alle Grupper ({groups.length})</h2>
          </div>
          {groups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Du er ikke medlem af nogen grupper endnu. Opret eller join en
              gruppe for at komme i gang!
            </div>
          ) : (
            <div className="divide-y">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-gray-600 mt-1">{group.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        Oprettet af {group.createdBy.name} •{" "}
                        {group.memberships.length} medlemmer •{" "}
                        {group._count.betMarkets} bet markets
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Invite code: <span className="font-mono font-semibold">{group.inviteCode}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

