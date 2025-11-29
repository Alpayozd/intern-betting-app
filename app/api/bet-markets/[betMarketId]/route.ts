import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent bet market detaljer
export async function GET(
  request: NextRequest,
  { params }: { params: { betMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
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
      return NextResponse.json(
        { error: "Bet market ikke fundet" },
        { status: 404 }
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
      return NextResponse.json(
        { error: "Du er ikke medlem af denne gruppe" },
        { status: 403 }
      )
    }

    // Tjek om brugeren er admin
    const isAdmin = membership.role === "ADMIN"

    // Hvis ikke admin, fjern bet counts fra response
    if (!isAdmin) {
      const betMarketWithoutBetCounts = {
        ...betMarket,
        betSubMarkets: betMarket.betSubMarkets.map((subMarket) => ({
          ...subMarket,
          betOptions: subMarket.betOptions.map((option) => {
            const { _count, ...optionWithoutCount } = option
            return optionWithoutCount
          }),
        })),
      }
      return NextResponse.json({ betMarket: betMarketWithoutBetCounts })
    }

    return NextResponse.json({ betMarket })
  } catch (error) {
    console.error("Get bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

