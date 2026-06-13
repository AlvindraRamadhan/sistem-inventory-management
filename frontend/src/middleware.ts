import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isProtectedAdmin = pathname.startsWith("/admin")
  const isProtectedApoteker = pathname.startsWith("/apoteker")
  const isAuthPage = pathname === "/login" || pathname === "/"

  // Redirect ke login jika tidak ada session
  if ((isProtectedAdmin || isProtectedApoteker) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Redirect ke dashboard sesuai role jika sudah login dan akses /login
  if (isAuthPage && user) {
    const role = user.user_metadata?.role as string | undefined
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = role === "admin" ? "/admin/dashboard" : "/apoteker/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  // Guard: apoteker tidak boleh akses /admin (kecuali shared routes)
  if (isProtectedAdmin && user?.user_metadata?.role === "apoteker") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/apoteker/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
