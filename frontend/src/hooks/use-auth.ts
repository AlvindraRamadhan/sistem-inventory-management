"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore, ROLE_REDIRECTS } from "@/store/auth-store";
import { ROUTES } from "@/lib/constants/routes";
import type { UserRole } from "@/types/auth";

//  useAuth 
// General auth state accessor — use for reading user info and calling actions.

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const hasRole = useAuthStore((s) => s.hasRole);
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    hasRole,
    hasAnyRole,
    hasPermission,
  };
}

//  useRequireAuth 
// Page-level guard. Call at the top of any page that requires auth.
//
//   const { user, isLoading } = useRequireAuth('admin');
//   const { user, isLoading } = useRequireAuth(['admin', 'apoteker']);
//
// - Not authenticated        → redirect /login
// - Wrong role               → redirect to role's home dashboard
// - isLoading = true         → not yet hydrated from localStorage

export function useRequireAuth(requiredRole?: UserRole | UserRole[]) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (requiredRole && user) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowed.includes(user.role)) {
        router.replace(ROLE_REDIRECTS[user.role]);
      }
    }
    // requiredRole is intentionally omitted — it's always a static value at call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, user?.role, router]);

  return { user, isLoading: !mounted };
}

//  useRedirectIfAuthenticated 
// Use on the login page: if the user already has a valid session, skip login
// and go straight to their dashboard.

export function useRedirectIfAuthenticated() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return;
    router.replace(ROLE_REDIRECTS[user.role]);
  }, [mounted, isAuthenticated, user?.role, router]); // eslint-disable-line react-hooks/exhaustive-deps
}
