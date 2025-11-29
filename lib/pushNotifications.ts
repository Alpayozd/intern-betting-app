"use client"

// Funktion til at registrere service worker og anmode om push notification tilladelse
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("Service Worker ikke supporteret")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service Worker registreret:", registration)
    return registration
  } catch (error) {
    console.error("Service Worker registrering fejlede:", error)
    return null
  }
}

// Funktion til at anmode om notification tilladelse
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("Notifications ikke supporteret")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "denied") {
    console.log("Notification tilladelse nægtet")
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Funktion til at abonnere på push notifications
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready

    // Hvis der ikke er en VAPID key, prøv at subscribe uden den (virker kun på localhost)
    const subscriptionOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
    }

    // Tilføj VAPID key hvis den findes
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (vapidKey) {
      subscriptionOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey)
    }

    const subscription = await registration.pushManager.subscribe(subscriptionOptions)

    // Send subscription til serveren
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      throw new Error("Kunne ikke abonnere på push notifications")
    }

    return subscription
  } catch (error) {
    console.error("Push subscription fejlede:", error)
    throw error
  }
}

// Funktion til at konvertere VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Funktion til at afmelde push notifications
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // Fjern subscription fra serveren
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })

      return true
    }
    return false
  } catch (error) {
    console.error("Unsubscribe fejlede:", error)
    throw error
  }
}

