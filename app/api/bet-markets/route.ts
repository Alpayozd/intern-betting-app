import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBetMarketSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(1, "Titel er påkrævet"),
  description: z.string().optional(),
  closesAt: z.string().datetime(),
})

// POST - Opret nyt bet market
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, title, description, closesAt } =
      createBetMarketSchema.parse(body)

    // Tjek om brugeren er medlem af gruppen
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId,
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

    // Opret bet market (uden options - de tilføjes via BetSubMarkets)
    const betMarket = await prisma.betMarket.create({
      data: {
        groupId,
        title,
        description,
        closesAt: new Date(closesAt),
        createdByUserId: session.user.id,
        status: "OPEN",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ betMarket }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create bet market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

