"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldX } from "lucide-react";

import { useAuthStore, ROLE_REDIRECTS } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import type { User, UserRole } from "@/types/auth";

//  Props 

interface RouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

//  RouteGuard 

export function RouteGuard({ allowedRoles, children, fallback }: RouteGuardProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect to login if session is missing
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [mounted, isAuthenticated, router]);

  //  Pre-hydration: unknown auth state 
  if (!mounted) {
    return fallback ? <>{fallback}</> : <GuardSpinner />;
  }

  //  No session: redirect in flight 
  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : <GuardSpinner />;
  }

  //  Wrong role: show 403 inline 
  if (!allowedRoles.includes(user.role)) {
    return <ForbiddenPage user={user} />;
  }

  return <>{children}</>;
}

// ─── GuardSpinner ─────────────────────────────────────────────────────────────

function GuardSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── ForbiddenPage ────────────────────────────────────────────────────────────

function ForbiddenPage({ user }: { user: User }) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          403 — Akses Ditolak
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          Anda tidak memiliki akses ke halaman ini
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Halaman ini hanya tersedia untuk peran tertentu.
          <br />
          Silakan kembali ke dashboard Anda.
        </p>
      </div>

      {/* Action */}
      <Button
        variant="outline"
        onClick={() => router.replace(ROLE_REDIRECTS[user.role])}
      >
        Kembali ke Dashboard
      </Button>
    </div>
  );
}
