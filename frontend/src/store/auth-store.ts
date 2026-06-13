import { create } from "zustand"
import type { UserRole, Permission } from "@/lib/constants/roles"
import { ROLE_PERMISSIONS } from "@/lib/constants/roles"
import { login, logout, getCurrentUser } from "@/services/auth.service"
import { createClient } from "@/lib/supabase/client"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  unit?: string
  avatar?: string
}

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  apoteker: "/apoteker/dashboard",
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  initializeFromSession: () => Promise<void>
  listenToAuthChanges: () => () => void
  setUser: (user: User | null) => void
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasPermission: (permission: Permission) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      await login(email, password)
      const currentUser = await getCurrentUser()
      if (!currentUser) throw new Error("Gagal mendapatkan data user.")
      set({ user: currentUser as User, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      const message = err instanceof Error ? err.message : "Email atau password tidak valid."
      return { success: false, error: message }
    }
  },

  logout: async () => {
    await logout()
    set({ user: null, isAuthenticated: false })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },

  initializeFromSession: async () => {
    set({ isLoading: true })
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        set({ user: currentUser as User, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  listenToAuthChanges: () => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          set({ user: currentUser as User, isAuthenticated: true })
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, isAuthenticated: false })
      }
    })
    return () => subscription.unsubscribe()
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  hasRole: (role) => get().user?.role === role,

  hasAnyRole: (roles) => {
    const { user } = get()
    if (!user) return false
    return roles.includes(user.role as UserRole)
  },

  hasPermission: (permission) => {
    const { user } = get()
    if (!user) return false
    return ROLE_PERMISSIONS[user.role as UserRole]?.includes(permission) ?? false
  },
}))
