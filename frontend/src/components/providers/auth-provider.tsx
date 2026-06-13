"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeFromSession, listenToAuthChanges } = useAuthStore()

  useEffect(() => {
    initializeFromSession()
    const unsubscribe = listenToAuthChanges()
    return unsubscribe
  }, [initializeFromSession, listenToAuthChanges])

  return <>{children}</>
}
