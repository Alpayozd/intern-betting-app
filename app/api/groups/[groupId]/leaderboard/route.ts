import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Hent leaderboard for en gruppe
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    // Tjek om brugeren er medlem af gruppen
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: params.groupId,
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

    // Hent alle group scores for gruppen, sorteret efter totalPoints
    const leaderboard = await prisma.groupScore.findMany({
      where: {
        groupId: params.groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        totalPoints: "desc",
      },
    })

    return NextResponse.json({
      leaderboard: leaderboard.map((score, index) => ({
        rank: index + 1,
        userId: score.user.id,
        userName: score.user.name,
        userEmail: score.user.email,
        totalPoints: score.totalPoints,
        initialPoints: score.initialPoints,
        isCurrentUser: score.userId === session.user.id,
      })),
    })
  } catch (error) {
    console.error("Get leaderboard error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

