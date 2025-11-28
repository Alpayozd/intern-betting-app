import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, "Invite code er påkrævet"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode } = joinGroupSchema.parse(body)

    // Find gruppe via invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Ugyldig invite code" },
        { status: 404 }
      )
    }

    // Tjek om brugeren allerede er medlem
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Du er allerede medlem af denne gruppe" },
        { status: 400 }
      )
    }

    // Opret membership og initial score
    await prisma.$transaction([
      prisma.groupMembership.create({
        data: {
          groupId: group.id,
          userId: session.user.id,
          role: "MEMBER",
        },
      }),
      prisma.groupScore.create({
        data: {
          groupId: group.id,
          userId: session.user.id,
          totalPoints: 1000,
          initialPoints: 1000,
        },
      }),
    ])

    return NextResponse.json(
      { message: "Du er nu medlem af gruppen", groupId: group.id },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Join group error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

