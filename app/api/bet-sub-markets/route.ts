import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBetSubMarketSchema = z.object({
  betMarketId: z.string().min(1),
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  closesAt: z.string().datetime(),
  betOptions: z.array(
    z.object({
      label: z.string().min(1),
      odds: z.number().positive(),
    })
  ).min(2, "Mindst 2 options er påkrævet"),
})

// POST - Opret nyt BetSubMarket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    
    // Valider at betMarketId er til stede
    if (!body.betMarketId || typeof body.betMarketId !== 'string') {
      return NextResponse.json(
        { error: "betMarketId er påkrævet" },
        { status: 400 }
      )
    }
    
    const { betMarketId, title, description, closesAt, betOptions } =
      createBetSubMarketSchema.parse(body)

    // Hent bet market og valider
    const betMarket = await prisma.betMarket.findUnique({
      where: { id: betMarketId },
      include: {
        group: {
          include: {
            memberships: true,
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

    // Tjek om brugeren er admin eller medlem
    const membership = betMarket.group.memberships.find(
      (m) => m.userId === session.user.id
    )

    if (!membership) {
      return NextResponse.json(
        { error: "Du er ikke medlem af denne gruppe" },
        { status: 403 }
      )
    }

    // Valider betMarketId igen før oprettelse
    if (!betMarketId || betMarketId.trim() === '') {
      console.error("betMarketId is missing or empty:", betMarketId)
      return NextResponse.json(
        { error: "betMarketId er påkrævet og må ikke være tom" },
        { status: 400 }
      )
    }
    
    console.log("Creating BetSubMarket with betMarketId:", betMarketId)
    
    // Opret BetSubMarket med options i en transaktion
    const betSubMarket = await prisma.$transaction(async (tx) => {
      const subMarket = await tx.betSubMarket.create({
        data: {
          betMarketId: betMarketId.trim(),
          title: title.trim(),
          description: description?.trim() || null,
          closesAt: new Date(closesAt),
          createdByUserId: session.user.id,
          betOptions: {
            create: betOptions.map((opt) => ({
              label: opt.label.trim(),
              odds: opt.odds,
            })),
          },
        },
        include: {
          betOptions: true,
        },
      })
      return subMarket
    })

    return NextResponse.json(betSubMarket, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create bet sub market error:", error)
    
    // Return mere detaljeret fejl i development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? (error as any)?.message || "Der opstod en fejl"
      : "Der opstod en fejl"
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          code: (error as any)?.code,
          meta: (error as any)?.meta,
        } : undefined
      },
      { status: 500 }
    )
  }
}

