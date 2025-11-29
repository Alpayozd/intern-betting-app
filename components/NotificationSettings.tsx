"use client"

import { useState, useEffect } from "react"
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/pushNotifications"

export default function NotificationSettings() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Tjek om notifications er supporteret
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Tjek om der allerede er en subscription
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Fejl ved tjek af subscription:", error)
      }
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Registrer service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        throw new Error("Kunne ikke registrere service worker")
      }

      // Anmod om tilladelse
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        throw new Error("Notification tilladelse blev nægtet")
      }

      setPermission("granted")

      // Abonner på push notifications
      await subscribeToPushNotifications()
      setIsSubscribed(true)

      alert("Notifikationer er nu aktiveret!")
    } catch (err: any) {
      setError(err.message || "Fejl ved aktivering af notifikationer")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    setError("")

    try {
      await unsubscribeFromPushNotifications()
      setIsSubscribed(false)
      alert("Notifikationer er nu deaktiveret")
    } catch (err: any) {
      setError(err.message || "Fejl ved deaktivering af notifikationer")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Push notifikationer er ikke supporteret i din browser
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Push Notifikationer
      </h3>

      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">
              Status
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {permission === "granted" && isSubscribed
                ? "Aktiveret"
                : permission === "denied"
                ? "Nægtet"
                : "Ikke aktiveret"}
            </p>
          </div>
          {permission === "granted" && isSubscribed ? (
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold min-h-[44px] touch-manipulation"
            >
              {isLoading ? "Deaktiverer..." : "Deaktiver"}
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === "denied"}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold min-h-[44px] touch-manipulation"
            >
              {isLoading ? "Aktiverer..." : "Aktiver"}
            </button>
          )}
        </div>

        {permission === "denied" && (
          <p className="text-xs sm:text-sm text-red-600">
            Du har nægtet notifikationer. Gå til browser indstillinger for at
            tillade dem igen.
          </p>
        )}
      </div>
    </div>
  )
}

