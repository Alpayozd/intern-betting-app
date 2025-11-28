import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settleBetSubMarketSchema = z.object({
  winningOptionIds: z.array(z.string().min(1)).min(1, "Mindst én vinder skal vælges"),
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
    const { winningOptionIds } = settleBetSubMarketSchema.parse(body)

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

    // Tjek om alle options findes
    const winningOptions = betSubMarket.betOptions.filter(
      (opt) => winningOptionIds.includes(opt.id)
    )
    if (winningOptions.length !== winningOptionIds.length) {
      return NextResponse.json(
        { error: "En eller flere winning options ikke fundet" },
        { status: 404 }
      )
    }

    // Hent alle vinder bets (fra alle vindende options)
    const winningBets = await prisma.betSelection.findMany({
      where: {
        betSubMarketId: params.betSubMarketId,
        betOptionId: {
          in: winningOptionIds,
        },
      },
      include: {
        user: true,
      },
    })

    // Opdater points og opret settlement i en transaktion
    await prisma.$transaction(async (tx) => {
      // Opret settlement med flere vindende options
      const settlement = await tx.betSubMarketSettlement.create({
        data: {
          betSubMarketId: params.betSubMarketId,
          settledByUserId: session.user.id,
          winningOptions: {
            create: winningOptionIds.map((optionId) => ({
              betOptionId: optionId,
            })),
          },
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

