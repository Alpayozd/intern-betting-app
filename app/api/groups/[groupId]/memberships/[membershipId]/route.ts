import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateMembershipSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
})

// PATCH - Opdater medlems rolle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string; membershipId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const { role } = updateMembershipSchema.parse(body)

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
        { error: "Kun admin kan opdatere medlemmer" },
        { status: 403 }
      )
    }

    // Tjek om membership findes
    const targetMembership = await prisma.groupMembership.findUnique({
      where: { id: params.membershipId },
    })

    if (!targetMembership || targetMembership.groupId !== params.groupId) {
      return NextResponse.json(
        { error: "Medlemskab ikke fundet" },
        { status: 404 }
      )
    }

    // Forhindre at den sidste admin fjerner sin egen admin rolle
    if (targetMembership.userId === session.user.id && role === "MEMBER") {
      const adminCount = await prisma.groupMembership.count({
        where: {
          groupId: params.groupId,
          role: "ADMIN",
        },
      })

      if (adminCount === 1) {
        return NextResponse.json(
          { error: "Kan ikke fjerne den sidste admin fra gruppen" },
          { status: 400 }
        )
      }
    }

    // Opdater rolle
    const updatedMembership = await prisma.groupMembership.update({
      where: { id: params.membershipId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ membership: updatedMembership })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Update membership error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

// DELETE - Fjern medlem fra gruppe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; membershipId: string } }
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
        { error: "Kun admin kan fjerne medlemmer" },
        { status: 403 }
      )
    }

    // Tjek om membership findes
    const targetMembership = await prisma.groupMembership.findUnique({
      where: { id: params.membershipId },
    })

    if (!targetMembership || targetMembership.groupId !== params.groupId) {
      return NextResponse.json(
        { error: "Medlemskab ikke fundet" },
        { status: 404 }
      )
    }

    // Forhindre at admin fjerner sig selv
    if (targetMembership.userId === session.user.id) {
      return NextResponse.json(
        { error: "Du kan ikke fjerne dig selv fra gruppen" },
        { status: 400 }
      )
    }

    // Forhindre at den sidste admin fjernes
    if (targetMembership.role === "ADMIN") {
      const adminCount = await prisma.groupMembership.count({
        where: {
          groupId: params.groupId,
          role: "ADMIN",
        },
      })

      if (adminCount === 1) {
        return NextResponse.json(
          { error: "Kan ikke fjerne den sidste admin fra gruppen" },
          { status: 400 }
        )
      }
    }

    // Slet membership og relateret data i en transaktion
    await prisma.$transaction([
      // Slet group score
      prisma.groupScore.deleteMany({
        where: {
          groupId: params.groupId,
          userId: targetMembership.userId,
        },
      }),
      // Slet membership
      prisma.groupMembership.delete({
        where: { id: params.membershipId },
      }),
    ])

    return NextResponse.json({ message: "Medlem fjernet fra gruppen" })
  } catch (error) {
    console.error("Delete membership error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

