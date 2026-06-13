"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";
import { ROUTES } from "@/lib/constants/routes";
import { LoadingScreen } from "@/components/layout/loading-screen";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initAuth = useAuthStore((s) => s.initializeFromSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Run once on mount: restore + validate session from localStorage
  useEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [initAuth]);

  // Redirect to login after restore if no valid session
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
