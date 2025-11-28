import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"

const createGroupSchema = z.object({
  name: z.string().min(1, "Navn er påkrævet"),
  description: z.string().optional(),
})

// GET - Hent alle grupper for brugeren
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      where: {
        memberships: {
          some: {
            userId: session.user.id,
          },
        },
      },
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
              },
            },
          },
        },
        _count: {
          select: {
            betMarkets: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Get groups error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// POST - Opret ny gruppe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = createGroupSchema.parse(body)

    // Generer unikt invite code
    const inviteCode = nanoid(8).toUpperCase()

    // Opret gruppe med admin membership
    const group = await prisma.group.create({
      data: {
        name,
        description,
        inviteCode,
        createdByUserId: session.user.id,
        memberships: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
        groupScores: {
          create: {
            userId: session.user.id,
            totalPoints: 1000,
            initialPoints: 1000,
          },
        },
      },
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Create group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

