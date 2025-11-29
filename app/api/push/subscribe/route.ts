import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Gem push subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const subscription = await request.json()

    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Ugyldig subscription" },
        { status: 400 }
      )
    }

    // Tjek om subscription allerede findes
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    })

    if (existing) {
      // Opdater eksisterende subscription
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId: session.user.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })
    } else {
      // Opret ny subscription
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })
    }

    return NextResponse.json({ message: "Subscription gemt" })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

