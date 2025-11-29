import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBetSubMarketSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  closesAt: z.string().datetime(),
  allowMultipleBets: z.boolean().optional(),
  betOptions: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, "Label er påkrævet"),
      odds: z.number().min(1, "Odds skal være mindst 1"),
    })
  ).min(2, "Mindst 2 options er påkrævet"),
})

// GET - Hent BetSubMarket detaljer
export async function GET(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const betSubMarket = await prisma.betSubMarket.findUnique({
      where: { id: params.betSubMarketId },
      include: {
        betMarket: {
          include: {
            group: true,
          },
        },
        betOptions: {
          include: {
            _count: {
              select: {
                betSelections: true,
              },
            },
          },
        },
        settlement: {
          include: {
            winningOptions: {
              include: {
                betOption: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
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

    // Tjek om brugeren er medlem og admin
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: betSubMarket.betMarket.groupId,
          userId: session.user.id,
        },
      },
    })

    const isAdmin = membership?.role === "ADMIN"

    // Hvis ikke admin, fjern bet counts fra response
    if (!isAdmin) {
      const betSubMarketWithoutBetCounts = {
        ...betSubMarket,
        betOptions: betSubMarket.betOptions.map((option) => {
          const { _count, ...optionWithoutCount } = option
          return optionWithoutCount
        }),
      }
      return NextResponse.json(betSubMarketWithoutBetCounts)
    }

    return NextResponse.json(betSubMarket)
  } catch (error) {
    console.error("Get bet sub market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// PATCH - Opdater BetSubMarket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateBetSubMarketSchema.parse(body)

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
        { error: "Kun admins kan redigere bet markets" },
        { status: 403 }
      )
    }

    // Tjek om allerede afgjort
    if (betSubMarket.status === "SETTLED") {
      return NextResponse.json(
        { error: "Kan ikke redigere et bet market der allerede er afgjort" },
        { status: 400 }
      )
    }

    // Opdater bet sub market og options i en transaktion
    await prisma.$transaction(async (tx) => {
      // Opdater bet sub market
      await tx.betSubMarket.update({
        where: { id: params.betSubMarketId },
        data: {
          title: parsed.title,
          description: parsed.description,
          closesAt: new Date(parsed.closesAt),
          allowMultipleBets: parsed.allowMultipleBets ?? false,
        },
      })

      // Hent eksisterende options
      const existingOptions = await tx.betOption.findMany({
        where: { betSubMarketId: params.betSubMarketId },
      })

      // Find options der skal opdateres, tilføjes eller fjernes
      const optionsToUpdate = parsed.betOptions.filter((opt) => opt.id)
      const optionsToCreate = parsed.betOptions.filter((opt) => !opt.id)
      const existingOptionIds = new Set(existingOptions.map((opt) => opt.id))
      const newOptionIds = new Set(
        parsed.betOptions.filter((opt) => opt.id).map((opt) => opt.id!)
      )
      const optionsToDelete = existingOptions.filter(
        (opt) => !newOptionIds.has(opt.id)
      )

      // Opdater eksisterende options
      for (const option of optionsToUpdate) {
        await tx.betOption.update({
          where: { id: option.id },
          data: {
            label: option.label,
            odds: option.odds,
          },
        })
      }

      // Opret nye options
      if (optionsToCreate.length > 0) {
        await tx.betOption.createMany({
          data: optionsToCreate.map((opt) => ({
            betSubMarketId: params.betSubMarketId,
            label: opt.label,
            odds: opt.odds,
          })),
        })
      }

      // Slet options der ikke længere er i listen
      // Cascade delete vil automatisk slette alle relaterede BetSelections
      if (optionsToDelete.length > 0) {
        const optionIdsToDelete = optionsToDelete.map((opt) => opt.id)
        
        // Slet først alle BetSelections der refererer til disse options (eksplicit for at sikre det)
        await tx.betSelection.deleteMany({
          where: {
            betOptionId: {
              in: optionIdsToDelete,
            },
          },
        })
        
        // Slet derefter options
        await tx.betOption.deleteMany({
          where: {
            id: {
              in: optionIdsToDelete,
            },
          },
        })
      }
    })

    return NextResponse.json({ message: "Bet sub market opdateret" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update bet sub market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// DELETE - Slet BetSubMarket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

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
        { error: "Kun admins kan slette bet markets" },
        { status: 403 }
      )
    }

    // Tjek om allerede afgjort
    if (betSubMarket.status === "SETTLED") {
      return NextResponse.json(
        { error: "Kan ikke slette et bet market der allerede er afgjort" },
        { status: 400 }
      )
    }

    // Slet bet sub market (cascade sletter også betOptions og betSelections)
    await prisma.betSubMarket.delete({
      where: { id: params.betSubMarketId },
    })

    return NextResponse.json({ message: "Bet sub market slettet" })
  } catch (error) {
    console.error("Delete bet sub market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

