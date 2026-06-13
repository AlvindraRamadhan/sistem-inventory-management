"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Halaman yang kamu cari tidak tersedia atau telah dipindahkan.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="action">
          <Link href="/admin/dashboard">Kembali ke Dashboard</Link>
        </Button>
        <Button
          variant="outline"
          size="action"
          onClick={() => window.history.back()}
        >
          Kembali ke Halaman Sebelumnya
        </Button>
      </div>
    </div>
  );
}
