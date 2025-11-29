import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Fjern push subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const subscription = await request.json()

    if (!subscription.endpoint) {
      return NextResponse.json(
        { error: "Ugyldig subscription" },
        { status: 400 }
      )
    }

    // Slet subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: subscription.endpoint,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Subscription fjernet" })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json(
      { error: "Der opstod en fejl" },
      { status: 500 }
    )
  }
}

