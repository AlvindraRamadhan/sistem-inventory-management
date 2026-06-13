import { createClient } from "@/lib/supabase/client"

export async function login(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.email ?? "",
    email: user.email ?? "",
    role: user.user_metadata?.role ?? "apoteker",
    avatar: user.user_metadata?.avatar_url,
    unit: user.user_metadata?.unit,
  }
}
