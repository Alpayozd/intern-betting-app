import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settleBetSubMarketSchema = z.object({
  winningOptionId: z.string().min(1),
})

// POST - Afgør et BetSubMarket
export async function POST(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { winningOptionId } = settleBetSubMarketSchema.parse(body)

    // Hent bet sub market
    const betSubMarket = await prisma.betSubMarket.findUnique({
      where: { id: params.betSubMarketId },
      include: {
        betMarket: {
          include: {
            group: {
              include: {
                memberships: true,
              },
            },
          },
        },
        betOptions: true,
        settlement: true,
      },
    })

    if (!betSubMarket) {
      return NextResponse.json(
        { error: "Bet sub market ikke fundet" },
        { status: 404 }
      )
    }

    // Tjek om brugeren er admin
    const membership = betSubMarket.betMarket.group.memberships.find(
      (m) => m.userId === session.user.id && m.role === "ADMIN"
    )

    if (!membership) {
      return NextResponse.json(
        { error: "Kun admins kan afgøre bet markets" },
        { status: 403 }
      )
    }

    // Tjek om allerede afgjort
    if (betSubMarket.settlement) {
      return NextResponse.json(
        { error: "Bet sub market er allerede afgjort" },
        { status: 400 }
      )
    }

    // Tjek om option findes
    const winningOption = betSubMarket.betOptions.find(
      (opt) => opt.id === winningOptionId
    )
    if (!winningOption) {
      return NextResponse.json(
        { error: "Winning option ikke fundet" },
        { status: 404 }
      )
    }

    // Hent alle vinder bets
    const winningBets = await prisma.betSelection.findMany({
      where: {
        betSubMarketId: params.betSubMarketId,
        betOptionId: winningOptionId,
      },
      include: {
        user: true,
      },
    })

    // Opdater points og opret settlement i en transaktion
    await prisma.$transaction(async (tx) => {
      // Opret settlement
      await tx.betSubMarketSettlement.create({
        data: {
          betSubMarketId: params.betSubMarketId,
          winningOptionId,
          settledByUserId: session.user.id,
        },
      })

      // Opdater bet sub market status
      await tx.betSubMarket.update({
        where: { id: params.betSubMarketId },
        data: { status: "SETTLED" },
      })

      // Opdater points for vindere
      for (const bet of winningBets) {
        await tx.groupScore.updateMany({
          where: {
            groupId: betSubMarket.betMarket.groupId,
            userId: bet.userId,
          },
          data: {
            totalPoints: {
              increment: bet.potentialPayoutPoints,
            },
          },
        })
      }
    })

    return NextResponse.json({ message: "Bet sub market afgjort" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Settle bet sub market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

