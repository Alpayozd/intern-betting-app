import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBetSelectionSchema = z.object({
  betSubMarketId: z.string().min(1),
  betOptionId: z.string().min(1),
  stakePoints: z.number().int().positive("Stake skal være positiv"),
})

// POST - Placer et bet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { betSubMarketId, betOptionId, stakePoints } =
      createBetSelectionSchema.parse(body)

    // Hent bet sub market og valider
    const betSubMarket = await prisma.betSubMarket.findUnique({
      where: { id: betSubMarketId },
      include: {
        betOptions: true,
        betMarket: {
          include: {
            group: true,
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

    // Valider at bet sub market er åbent
    if (betSubMarket.status !== "OPEN") {
      return NextResponse.json(
        { error: "Bet sub market er ikke åbent" },
        { status: 400 }
      )
    }

    // Valider at closesAt ikke er passeret
    if (new Date() > betSubMarket.closesAt) {
      return NextResponse.json(
        { error: "Bet sub market er lukket" },
        { status: 400 }
      )
    }

    // Tjek om option findes
    const betOption = betSubMarket.betOptions.find(
      (opt) => opt.id === betOptionId
    )
    if (!betOption) {
      return NextResponse.json(
        { error: "Bet option ikke fundet" },
        { status: 404 }
      )
    }

    // Tjek om brugeren er medlem af gruppen
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: betSubMarket.betMarket.groupId,
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

    // Hent eller opret brugerens point saldo
    let groupScore = await prisma.groupScore.findUnique({
      where: {
        groupId_userId: {
          groupId: betSubMarket.betMarket.groupId,
          userId: session.user.id,
        },
      },
    })

    // Hvis groupScore ikke findes, opret den med 1000 start points
    if (!groupScore) {
      groupScore = await prisma.groupScore.create({
        data: {
          groupId: betSubMarket.betMarket.groupId,
          userId: session.user.id,
          totalPoints: 1000,
          initialPoints: 1000,
        },
      })
    }

    if (groupScore.totalPoints < stakePoints) {
      return NextResponse.json(
        { error: "Utilstrækkelige points" },
        { status: 400 }
      )
    }

    // Beregn potential payout
    const potentialPayoutPoints = stakePoints * betOption.odds

    // Opret bet selection og opdater point saldo i en transaktion
    await prisma.$transaction([
      prisma.betSelection.create({
        data: {
          betSubMarketId,
          betOptionId,
          userId: session.user.id,
          stakePoints,
          potentialPayoutPoints,
        },
      }),
      prisma.groupScore.update({
        where: {
          groupId_userId: {
            groupId: betSubMarket.betMarket.groupId,
            userId: session.user.id,
          },
        },
        data: {
          totalPoints: {
            decrement: stakePoints,
          },
        },
      }),
    ])

    return NextResponse.json(
      { message: "Bet placeret", potentialPayoutPoints },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create bet selection error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

