"use client";

import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/auth";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ─── RoleGate ─────────────────────────────────────────────────────────────────
// Conditionally renders children based on the current user's role.
// This is a UI-only guard — it hides content but does NOT redirect.
// For route-level protection use RouteGuard or useRequireAuth instead.
//
// Usage:
//   <RoleGate allowedRoles={['admin']}>
//     <ApproveButton />
//   </RoleGate>
//
//   <RoleGate allowedRoles={['admin']} fallback={<ReadOnlyView />}>
//     <EditPanel />
//   </RoleGate>

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const role = useAuthStore((s) => s.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
