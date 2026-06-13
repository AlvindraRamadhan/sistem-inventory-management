"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore, ROLE_REDIRECTS } from "@/store/auth-store";
import { ROUTES } from "@/lib/constants/routes";
import { LoadingScreen } from "@/components/layout/loading-screen";

export default function RootPage() {
  const router = useRouter();
  const initAuth = useAuthStore((s) => s.initializeFromSession);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const MIN_LOADING_MS = 3000;
    const start = Date.now();
    initAuth();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    const timer = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
    }, remaining);
    return () => clearTimeout(timer);
  }, [initAuth]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated || !user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    router.replace(ROLE_REDIRECTS[user.role]);
  }, [ready, isAuthenticated, user, router]);

  return <LoadingScreen />;
}
