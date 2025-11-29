"use client"

import { useAutoRefresh } from "@/hooks/useAutoRefresh"

interface AutoRefreshWrapperProps {
  children: React.ReactNode
  interval?: number // i millisekunder, default 5000 (5 sekunder)
  enabled?: boolean // om auto-refresh er aktiveret, default true
}

/**
 * Wrapper komponent der automatisk opdaterer siden med router.refresh()
 * Brug denne komponent på server component sider der skal opdatere automatisk
 */
export default function AutoRefreshWrapper({
  children,
  interval = 5000,
  enabled = true,
}: AutoRefreshWrapperProps) {
  useAutoRefresh({ interval, enabled })
  
  return <>{children}</>
}

