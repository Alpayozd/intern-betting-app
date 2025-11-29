import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent alle brugerens bets i en gruppe
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Tjek om brugeren er medlem
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: params.groupId,
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

    // Hent alle bet markets i gruppen
    const betMarkets = await prisma.betMarket.findMany({
      where: { groupId: params.groupId },
      include: {
        betSubMarkets: {
          include: {
            betOptions: true,
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
        },
      },
    })

    // Hent alle brugerens bets i alle bet sub markets i gruppen
    const allBetSubMarketIds = betMarkets.flatMap((bm) =>
      bm.betSubMarkets.map((sm) => sm.id)
    )

    const myBets = await prisma.betSelection.findMany({
      where: {
        userId: session.user.id,
        betSubMarketId: {
          in: allBetSubMarketIds,
        },
      },
      include: {
        betSubMarket: {
          include: {
            betMarket: {
              select: {
                id: true,
                title: true,
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
        },
        betOption: {
          select: {
            id: true,
            label: true,
            odds: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Hent brugerens points i gruppen
    const userScore = await prisma.groupScore.findUnique({
      where: {
        groupId_userId: {
          groupId: params.groupId,
          userId: session.user.id,
        },
      },
    })

    // Beregn totals
    const totalStake = myBets.reduce((sum, bet) => sum + bet.stakePoints, 0)
    const totalPotentialPayout = myBets.reduce(
      (sum, bet) => sum + bet.potentialPayoutPoints,
      0
    )

    return NextResponse.json({
      bets: myBets,
      totalStake,
      totalPotentialPayout,
      userPoints: userScore?.totalPoints || 0,
    })
  } catch (error) {
    console.error("Get my bets error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

