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

    // Opret BetSubMarket med options i en transaktion
    const betSubMarket = await prisma.$transaction(async (tx) => {
      const subMarket = await tx.betSubMarket.create({
        data: {
          betMarketId,
          title,
          description,
          closesAt: new Date(closesAt),
          createdByUserId: session.user.id,
          betOptions: {
            create: betOptions.map((opt) => ({
              label: opt.label,
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
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

