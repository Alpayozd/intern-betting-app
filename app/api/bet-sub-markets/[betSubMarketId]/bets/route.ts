import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent alle bets for et BetSubMarket (kun for admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { betSubMarketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Hent bet sub market og tjek om brugeren er admin
    const betSubMarket = await prisma.betSubMarket.findUnique({
      where: { id: params.betSubMarketId },
      include: {
        betMarket: {
          include: {
            group: {
              include: {
                memberships: {
                  where: { userId: session.user.id },
                },
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
    const membership = betSubMarket.betMarket.group.memberships[0]
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Kun admin kan se bet detaljer" },
        { status: 403 }
      )
    }

    // Hent alle bets for dette sub market
    const bets = await prisma.betSelection.findMany({
      where: { betSubMarketId: params.betSubMarketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        betOption: {
          select: {
            id: true,
            label: true,
            odds: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ bets })
  } catch (error) {
    console.error("Get bets error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

