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
    
    // Log request body for debugging
    console.log("Bet selection request body:", JSON.stringify(body))
    
    // Sikrer at stakePoints er et number
    if (typeof body.stakePoints === 'string') {
      body.stakePoints = parseInt(body.stakePoints, 10)
    }
    
    const { betSubMarketId, betOptionId, stakePoints } =
      createBetSelectionSchema.parse(body)
    
    console.log("Parsed data:", { betSubMarketId, betOptionId, stakePoints, stakePointsType: typeof stakePoints })

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
    
    console.log("BetSubMarket found:", betSubMarket ? "Yes" : "No")
    if (betSubMarket) {
      console.log("BetSubMarket status:", betSubMarket.status)
      console.log("BetSubMarket closesAt:", betSubMarket.closesAt)
      console.log("BetSubMarket allowMultipleBets:", betSubMarket.allowMultipleBets)
      console.log("BetOptions count:", betSubMarket.betOptions.length)
    }

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

    // Tjek om brugeren allerede har et bet på denne option (hvis allowMultipleBets er false)
    if (!betSubMarket.allowMultipleBets) {
      const existingBet = await prisma.betSelection.findFirst({
        where: {
          betSubMarketId,
          userId: session.user.id,
        },
      })
      
      if (existingBet) {
        return NextResponse.json(
          { error: "Du har allerede placeret et bet på dette market. Rediger dit eksisterende bet i stedet." },
          { status: 400 }
        )
      }
    }

    // Opret bet selection og opdater point saldo i en transaktion
    try {
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
    } catch (dbError: any) {
      console.error("Database error creating bet selection:", dbError)
      
      // Hvis det er en unique constraint fejl
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "Du har allerede placeret et bet på denne option" },
          { status: 400 }
        )
      }
      
      // Hvis det er en foreign key constraint fejl
      if (dbError.code === 'P2003') {
        return NextResponse.json(
          { error: "Ugyldig bet option eller market" },
          { status: 400 }
        )
      }
      
      throw dbError // Re-throw hvis det er en anden fejl
    }

    return NextResponse.json(
      { message: "Bet placeret", potentialPayoutPoints },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error:", error.errors)
      return NextResponse.json(
        { error: error.errors[0].message, details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create bet selection error:", error)
    
    // Returner mere detaljeret fejlbesked i development
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Der opstod en fejl"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: 500 }
    )
  }
}

