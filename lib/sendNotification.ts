import webpush from "web-push"
import { prisma } from "@/lib/prisma"

// Konfigurer web-push med VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:your-email@example.com"

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface NotificationPayload {
  title: string
  body: string
  url?: string
  tag?: string
  requireInteraction?: boolean
}

/**
 * Send push notification til en specifik bruger
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
) {
  try {
    // Hent alle push subscriptions for brugeren
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      console.log(`Ingen push subscriptions fundet for bruger ${userId}`)
      return { sent: 0, failed: 0 }
    }

    let sent = 0
    let failed = 0

    // Send notification til hver subscription
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/",
            tag: payload.tag,
            requireInteraction: payload.requireInteraction || false,
          })
        )
        sent++
      } catch (error: any) {
        console.error("Fejl ved sending af notification:", error)
        
        // Hvis subscription er ugyldig, slet den
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          })
        }
        
        failed++
      }
    })

    await Promise.allSettled(promises)

    return { sent, failed }
  } catch (error) {
    console.error("Fejl ved sendNotificationToUser:", error)
    throw error
  }
}

/**
 * Send push notification til alle medlemmer af en gruppe
 */
export async function sendNotificationToGroup(
  groupId: string,
  payload: NotificationPayload
) {
  try {
    // Hent alle medlemmer af gruppen
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId },
      select: { userId: true },
    })

    const userIds = memberships.map((m) => m.userId)

    let totalSent = 0
    let totalFailed = 0

    // Send til hver bruger
    for (const userId of userIds) {
      const result = await sendNotificationToUser(userId, payload)
      totalSent += result.sent
      totalFailed += result.failed
    }

    return { sent: totalSent, failed: totalFailed }
  } catch (error) {
    console.error("Fejl ved sendNotificationToGroup:", error)
    throw error
  }
}

