import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settleBetMarketSchema = z.object({
  winningOptionId: z.string().min(1, "Vindende option er påkrævet"),
})

// POST - Afgør bet market (kun admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { betMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { winningOptionId } = settleBetMarketSchema.parse(body)

    // Hent bet market
    const betMarket = await prisma.betMarket.findUnique({
      where: { id: params.betMarketId },
      include: {
        group: true,
        betOptions: true,
      },
    })

    if (!betMarket) {
      return NextResponse.json(
        { error: "Bet market ikke fundet" },
        { status: 404 }
      )
    }

    // Tjek om option findes
    const winningOption = betMarket.betOptions.find(
      (opt) => opt.id === winningOptionId
    )
    if (!winningOption) {
      return NextResponse.json(
        { error: "Vindende option ikke fundet" },
        { status: 404 }
      )
    }

    // Tjek om brugeren er admin i gruppen
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: betMarket.groupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Kun admins kan afgøre bet markets" },
        { status: 403 }
      )
    }

    // Tjek om bet market allerede er afgjort
    if (betMarket.status === "SETTLED") {
      return NextResponse.json(
        { error: "Bet market er allerede afgjort" },
        { status: 400 }
      )
    }

    // Hent alle vindende bet selections
    const winningSelections = await prisma.betSelection.findMany({
      where: {
        betMarketId: params.betMarketId,
        betOptionId: winningOptionId,
      },
      include: {
        user: true,
      },
    })

    // Opdater point saldoer for vindere og opret settlement i en transaktion
    await prisma.$transaction(async (tx) => {
      // Opdater point for alle vindere
      for (const selection of winningSelections) {
        await tx.groupScore.update({
          where: {
            groupId_userId: {
              groupId: betMarket.groupId,
              userId: selection.userId,
            },
          },
          data: {
            totalPoints: {
              increment: selection.potentialPayoutPoints,
            },
          },
        })
      }

      // Opret settlement
      await tx.betSettlement.create({
        data: {
          betMarketId: params.betMarketId,
          winningOptionId,
          settledByUserId: session.user.id,
        },
      })

      // Opdater bet market status
      await tx.betMarket.update({
        where: { id: params.betMarketId },
        data: { status: "SETTLED" },
      })
    })

    return NextResponse.json(
      {
        message: "Bet market afgjort",
        winnersCount: winningSelections.length,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Settle bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

