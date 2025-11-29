import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateGroupSchema = z.object({
  name: z.string().min(1, "Navn er påkrævet"),
  description: z.string().optional(),
})

// GET - Hent gruppe detaljer
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        groupScores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            totalPoints: "desc",
          },
        },
        betMarkets: {
          include: {
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
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Gruppe ikke fundet" }, { status: 404 })
    }

    // Tjek om brugeren er medlem
    const isMember = group.memberships.some(
      (m) => m.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: "Du er ikke medlem af denne gruppe" },
        { status: 403 }
      )
    }

    // Tjek om brugeren er admin
    const userMembership = group.memberships.find(
      (m) => m.userId === session.user.id
    )
    const isAdmin = userMembership?.role === "ADMIN"

    // Hvis ikke admin, fjern bet counts fra response
    if (!isAdmin) {
      // Fjern _count.betSelections fra alle betOptions
      const groupWithoutBetCounts = {
        ...group,
        betMarkets: group.betMarkets.map((market) => ({
          ...market,
          betSubMarkets: market.betSubMarkets.map((subMarket) => ({
            ...subMarket,
            betOptions: subMarket.betOptions.map((option) => {
              const { _count, ...optionWithoutCount } = option
              return optionWithoutCount
            }),
          })),
        })),
      }
      return NextResponse.json({ group: groupWithoutBetCounts })
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error("Get group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// PATCH - Opdater gruppe
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = updateGroupSchema.parse(body)

    // Hent gruppe og tjek om brugeren er admin
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        memberships: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Gruppe ikke fundet" }, { status: 404 })
    }

    const membership = group.memberships[0]
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Kun admin kan redigere gruppen" },
        { status: 403 }
      )
    }

    // Opdater gruppe
    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: {
        name,
        description: description || null,
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

    return NextResponse.json({ group: updatedGroup })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// DELETE - Slet gruppe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Hent gruppe og tjek om brugeren er admin
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        memberships: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Gruppe ikke fundet" }, { status: 404 })
    }

    const membership = group.memberships[0]
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Kun admin kan slette gruppen" },
        { status: 403 }
      )
    }

    // Slet gruppe (cascade sletter automatisk alle relaterede data)
    await prisma.group.delete({
      where: { id: params.groupId },
    })

    return NextResponse.json({ message: "Gruppe slettet" })
  } catch (error) {
    console.error("Delete group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

