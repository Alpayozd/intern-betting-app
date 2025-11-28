import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    return NextResponse.json(betSubMarket)
  } catch (error) {
    console.error("Get bet sub market error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

