import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBetSubMarketSchema = z.object({
  betMarketId: z.string()
    .min(1, "betMarketId er påkrævet")
    .refine((val) => val !== null && val !== undefined && val.trim() !== '', {
      message: "betMarketId må ikke være null, undefined eller tom"
    }),
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
    
    // Log hele request body for debugging
    console.log("Received request body:", JSON.stringify(body, null, 2))
    console.log("betMarketId type:", typeof body.betMarketId)
    console.log("betMarketId value:", body.betMarketId)
    
    // Valider at betMarketId er til stede og ikke null/undefined/empty
    if (!body.betMarketId || typeof body.betMarketId !== 'string' || body.betMarketId.trim() === '') {
      console.error("betMarketId validation failed:", {
        exists: !!body.betMarketId,
        type: typeof body.betMarketId,
        value: body.betMarketId
      })
      return NextResponse.json(
        { error: "betMarketId er påkrævet og må ikke være tom" },
        { status: 400 }
      )
    }
    
    const parsed = createBetSubMarketSchema.parse(body)
    const { betMarketId, title, description, closesAt, betOptions } = parsed
    
    // Double-check efter Zod parsing
    if (!betMarketId || betMarketId.trim() === '') {
      console.error("betMarketId is empty after Zod parsing:", betMarketId)
      return NextResponse.json(
        { error: "betMarketId er påkrævet" },
        { status: 400 }
      )
    }
    
    console.log("After Zod parsing - betMarketId:", betMarketId)

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

    // Final validation før Prisma oprettelse
    const trimmedBetMarketId = betMarketId.trim()
    if (!trimmedBetMarketId) {
      console.error("betMarketId is empty after trim:", betMarketId)
      return NextResponse.json(
        { error: "betMarketId er påkrævet og må ikke være tom" },
        { status: 400 }
      )
    }
    
    console.log("Creating BetSubMarket with betMarketId:", trimmedBetMarketId)
    console.log("Full data object:", {
      betMarketId: trimmedBetMarketId,
      title: title.trim(),
      createdByUserId: session.user.id,
      closesAt: new Date(closesAt),
    })
    
    // Final null check før Prisma
    if (!trimmedBetMarketId || trimmedBetMarketId === null || trimmedBetMarketId === undefined) {
      console.error("CRITICAL: betMarketId is null/undefined before Prisma create:", {
        original: betMarketId,
        trimmed: trimmedBetMarketId,
        type: typeof trimmedBetMarketId
      })
      return NextResponse.json(
        { error: "betMarketId er påkrævet" },
        { status: 400 }
      )
    }
    
    // Opret BetSubMarket med options i en transaktion
    const betSubMarket = await prisma.$transaction(async (tx) => {
      // Double-check igen inde i transaktionen
      if (!trimmedBetMarketId) {
        throw new Error("betMarketId is missing in transaction")
      }
      
      const subMarket = await tx.betSubMarket.create({
        data: {
          betMarketId: trimmedBetMarketId, // Sikrer at vi sender en string, ikke null
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

