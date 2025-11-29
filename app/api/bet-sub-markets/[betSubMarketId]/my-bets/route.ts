import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent brugerens egne bets for et BetSubMarket
export async function GET(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Hent bet sub market og tjek om brugeren er medlem
    const betSubMarket = await prisma.betSubMarket.findUnique({
      where: { id: params.betSubMarketId },
      include: {
        betMarket: {
          include: {
            group: {
              include: {
                memberships: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    })

    if (!betSubMarket) {
      return NextResponse.json(
        { error: "Bet sub market ikke fundet" },
        { status: 404 }
      )
    }

    // Tjek om brugeren er medlem
    const membership = betSubMarket.betMarket.group.memberships[0]
    if (!membership) {
      return NextResponse.json(
        { error: "Du er ikke medlem af denne gruppe" },
        { status: 403 }
      )
    }

    // Hent brugerens bets for dette sub market
    const myBets = await prisma.betSelection.findMany({
      where: {
        betSubMarketId: params.betSubMarketId,
        userId: session.user.id,
      },
      include: {
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
          groupId: betSubMarket.betMarket.groupId,
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

