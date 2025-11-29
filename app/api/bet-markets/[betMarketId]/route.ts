import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBetMarketSchema = z.object({
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  closesAt: z.string().datetime(),
})

// GET - Hent bet market detaljer
export async function GET(
  request: NextRequest,
  { params }: { params: { betMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const betMarket = await prisma.betMarket.findUnique({
      where: { id: params.betMarketId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        betSubMarkets: {
          include: {
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
          orderBy: {
            createdAt: "desc",
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

    // Tjek om brugeren er medlem af gruppen
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: betMarket.groupId,
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

    // Tjek om brugeren er admin
    const isAdmin = membership.role === "ADMIN"

    // Hvis ikke admin, fjern bet counts fra response
    if (!isAdmin) {
      const betMarketWithoutBetCounts = {
        ...betMarket,
        betSubMarkets: betMarket.betSubMarkets.map((subMarket) => ({
          ...subMarket,
          betOptions: subMarket.betOptions.map((option) => {
            const { _count, ...optionWithoutCount } = option
            return optionWithoutCount
          }),
        })),
      }
      return NextResponse.json({ betMarket: betMarketWithoutBetCounts })
    }

    return NextResponse.json({ betMarket })
  } catch (error) {
    console.error("Get bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// PATCH - Opdater BetMarket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { betMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateBetMarketSchema.parse(body)

    // Hent bet market
    const betMarket = await prisma.betMarket.findUnique({
      where: { id: params.betMarketId },
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

    // Tjek om brugeren er admin
    const membership = betMarket.group.memberships.find(
      (m) => m.userId === session.user.id && m.role === "ADMIN"
    )

    if (!membership) {
      return NextResponse.json(
        { error: "Kun admins kan redigere bet markets" },
        { status: 403 }
      )
    }

    // Tjek om allerede afgjort
    if (betMarket.status === "SETTLED") {
      return NextResponse.json(
        { error: "Kan ikke redigere et bet market der allerede er afgjort" },
        { status: 400 }
      )
    }

    // Opdater bet market
    await prisma.betMarket.update({
      where: { id: params.betMarketId },
      data: {
        title: parsed.title,
        description: parsed.description,
        closesAt: new Date(parsed.closesAt),
      },
    })

    return NextResponse.json({ message: "Bet market opdateret" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// DELETE - Slet BetMarket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { betMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Hent bet market
    const betMarket = await prisma.betMarket.findUnique({
      where: { id: params.betMarketId },
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

    // Tjek om brugeren er admin
    const membership = betMarket.group.memberships.find(
      (m) => m.userId === session.user.id && m.role === "ADMIN"
    )

    if (!membership) {
      return NextResponse.json(
        { error: "Kun admins kan slette bet markets" },
        { status: 403 }
      )
    }

    // Tjek om allerede afgjort
    if (betMarket.status === "SETTLED") {
      return NextResponse.json(
        { error: "Kan ikke slette et bet market der allerede er afgjort" },
        { status: 400 }
      )
    }

    // Slet bet market (cascade sletter også betSubMarkets, betOptions og betSelections)
    await prisma.betMarket.delete({
      where: { id: params.betMarketId },
    })

    return NextResponse.json({ message: "Bet market slettet" })
  } catch (error) {
    console.error("Delete bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

