import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent gruppe detaljer
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
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
                email: true,
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
      return NextResponse.json({ error: "Gruppe ikke fundet" }, { status: 404 })
    }

    // Tjek om brugeren er medlem
    const isMember = group.memberships.some(
      (m) => m.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: "Du er ikke medlem af denne gruppe" },
        { status: 403 }
      )
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

