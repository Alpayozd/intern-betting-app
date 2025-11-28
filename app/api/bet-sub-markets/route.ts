import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
import { Prisma } from "@prisma/client"

const createBetSubMarketSchema = z.object({
  betMarketId: z.string()
    .nonempty("betMarketId er påkrævet")
    .refine((val) => {
      const trimmed = val?.trim()
      return trimmed !== null && trimmed !== undefined && trimmed !== ''
    }, {
      message: "betMarketId må ikke være null, undefined eller tom"
    })
    .transform((val) => val.trim()), // Transform til trimmed version
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
    
    let parsed
    try {
      parsed = createBetSubMarketSchema.parse(body)
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error("Zod validation error:", zodError.errors)
        return NextResponse.json(
          { error: zodError.errors[0].message, details: zodError.errors },
          { status: 400 }
        )
      }
      throw zodError
    }
    
    const { betMarketId, title, description, closesAt, betOptions } = parsed
    
    // Double-check efter Zod parsing - betMarketId skal være en non-empty string
    if (!betMarketId || typeof betMarketId !== 'string' || betMarketId.trim() === '') {
      console.error("betMarketId validation failed after Zod parsing:", {
        betMarketId,
        type: typeof betMarketId,
        isEmpty: betMarketId?.trim() === ''
      })
      return NextResponse.json(
        { error: "betMarketId er påkrævet og må ikke være tom" },
        { status: 400 }
      )
    }
    
    console.log("After Zod parsing - betMarketId:", betMarketId, "type:", typeof betMarketId)

    // Hent bet market og valider
    console.log("Looking for BetMarket with id:", betMarketId)
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
      console.error("BetMarket not found with id:", betMarketId)
      return NextResponse.json(
        { error: "Bet market ikke fundet" },
        { status: 404 }
      )
    }
    
    console.log("BetMarket found:", {
      id: betMarket.id,
      title: betMarket.title,
      groupId: betMarket.groupId
    })

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
    // BRUGER RAW SQL som workaround for Prisma Client problem
    const betSubMarket = await prisma.$transaction(async (tx) => {
      // Final validation - sikrer at betMarketId er en non-empty string
      if (!trimmedBetMarketId || typeof trimmedBetMarketId !== 'string' || trimmedBetMarketId.trim().length === 0) {
        console.error("CRITICAL: betMarketId validation failed in transaction:", {
          original: betMarketId,
          trimmed: trimmedBetMarketId,
          type: typeof trimmedBetMarketId
        })
        throw new Error("betMarketId is missing or invalid in transaction")
      }
      
      // Eksplicit konstruer alle værdier først
      const finalBetMarketIdValue = trimmedBetMarketId.trim()
      const finalTitle = title.trim()
      const finalDescription = description?.trim() || null
      const finalClosesAt = new Date(closesAt)
      const finalCreatedByUserId = session.user.id
      
      // Valider alle værdier
      if (!finalBetMarketIdValue || finalBetMarketIdValue.length === 0) {
        throw new Error("betMarketId is empty after trim")
      }
      if (!finalTitle || finalTitle.length === 0) {
        throw new Error("title is empty")
      }
      if (!finalCreatedByUserId || finalCreatedByUserId.length === 0) {
        throw new Error("createdByUserId is empty")
      }
      
      // Generer ID med nanoid
      const subMarketId = nanoid()
      
      // Log før oprettelse
      console.log("About to create BetSubMarket with RAW SQL:", {
        id: subMarketId,
        betMarketId: finalBetMarketIdValue,
        betMarketIdType: typeof finalBetMarketIdValue,
        betMarketIdLength: finalBetMarketIdValue.length,
        title: finalTitle,
        createdByUserId: finalCreatedByUserId,
        closesAt: finalClosesAt.toISOString()
      })
      
      // Opret BetSubMarket med RAW SQL for at omgå Prisma Client problem
      // Brug Prisma.sql template tag for korrekt parameter binding
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "BetSubMarket" ("id", "betMarketId", "title", "description", "status", "createdByUserId", "closesAt", "createdAt")
        VALUES (${subMarketId}, ${finalBetMarketIdValue}, ${finalTitle}, ${finalDescription}, 'OPEN', ${finalCreatedByUserId}, ${finalClosesAt}::timestamp, NOW())
      `)
      
      console.log("BetSubMarket created with id:", subMarketId, "betMarketId:", finalBetMarketIdValue)
      
      // Opret BetOptions derefter
      if (betOptions.length > 0) {
        for (const opt of betOptions) {
          const optionId = nanoid()
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "BetOption" ("id", "betSubMarketId", "label", "odds", "createdAt")
            VALUES (${optionId}, ${subMarketId}, ${opt.label.trim()}, ${opt.odds}::double precision, NOW())
          `)
        }
      }
      
      // Hent den fulde BetSubMarket med options
      const fullSubMarket = await tx.betSubMarket.findUnique({
        where: { id: subMarketId },
        include: {
          betOptions: true,
        },
      })
      
      if (!fullSubMarket) {
        throw new Error("Failed to retrieve created BetSubMarket")
      }
      
      return fullSubMarket
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

