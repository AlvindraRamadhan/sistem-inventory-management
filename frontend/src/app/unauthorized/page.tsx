"use client";

import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore, ROLE_REDIRECTS } from "@/store/auth-store";
import { ROUTES } from "@/lib/constants/routes";

export default function UnauthorizedPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  function handleBack() {
    if (!user) {
      router.replace(ROUTES.LOGIN);
    } else {
      router.replace(ROLE_REDIRECTS[user.role]);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      {/* Icon — muted, tidak dramatis */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ShieldX className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Copy */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          403
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Akses Ditolak</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>

      {/* Action */}
      <Button variant="outline" onClick={handleBack}>
        Kembali ke Dashboard
      </Button>
    </div>
  );
}
