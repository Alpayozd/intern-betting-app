"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface UseAutoRefreshOptions {
  interval?: number // i millisekunder, default 5000 (5 sekunder)
  enabled?: boolean // om auto-refresh er aktiveret, default true
}

/**
 * Hook til automatisk at opdatere siden med router.refresh()
 * Stopper automatisk når siden ikke er aktiv (tab er i baggrunden)
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const router = useRouter()
  const { interval = 5000, enabled = true } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    // Tjek om siden er aktiv
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden
      
      // Hvis siden bliver aktiv igen, start refresh
      if (isActiveRef.current && !intervalRef.current) {
        startRefresh()
      }
      
      // Hvis siden bliver inaktiv, stop refresh
      if (!isActiveRef.current && intervalRef.current) {
        stopRefresh()
      }
    }

    const startRefresh = () => {
      if (intervalRef.current) return // Allerede kørende
      
      intervalRef.current = setInterval(() => {
        // Kun refresh hvis siden er aktiv
        if (isActiveRef.current) {
          router.refresh()
        }
      }, interval)
    }

    const stopRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Start refresh når komponenten mountes
    startRefresh()

    // Lyt til visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      stopRefresh()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, interval, enabled])
}

