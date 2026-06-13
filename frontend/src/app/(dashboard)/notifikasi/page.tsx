"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  FilePen,
  LayoutList,
  Package,
  PackageCheck,
  Search,
  Settings,
  ShoppingCart,
  Stethoscope,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import {
  useNotificationStore,
  type Notification,
  type NotifType,
} from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";

// ─── Kategori mapping ──────────────────────────────────────────────────────────

function getNotifKategori(notifType: NotifType): string {
  const map: Record<string, string> = {
    stok_kritis: "stok",
    ed_mendekat: "stok",
    gr_perlu_input: "procurement",
    gr_ditolak: "procurement",
    gr_disetujui: "procurement",
    defekta_pending: "procurement",
    defekta_approved: "procurement",
    defekta_rejected: "procurement",
    po_diterima: "procurement",
    invoice_jatuh_tempo: "procurement",
    kalibrasi_jatuh_tempo: "alkes",
    kalibrasi_overdue: "alkes",
    resep_masuk: "sistem",
    resep_diproses: "sistem",
  };
  return map[notifType] ?? "sistem";
}

// ─── Icon & colour config ──────────────────────────────────────────────────────

interface IconConfig {
  icon: React.ElementType;
  bg: string;
  color: string;
}

const ICON_CONFIG: Record<NotifType, IconConfig> = {
  stok_kritis: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
  },
  ed_mendekat: {
    icon: Clock,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600 dark:text-amber-400",
  },
  gr_perlu_input: {
    icon: Package,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
  },
  gr_ditolak: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
  },
  gr_disetujui: {
    icon: PackageCheck,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  defekta_approved: {
    icon: CheckCircle2,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  defekta_rejected: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
  },
  defekta_pending: {
    icon: AlertCircle,
    bg: "bg-orange-100 dark:bg-orange-900/30",
    color: "text-orange-600 dark:text-orange-400",
  },
  po_diterima: {
    icon: ShoppingCart,
    bg: "bg-primary/10",
    color: "text-primary",
  },
  kalibrasi_jatuh_tempo: {
    icon: Wrench,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600 dark:text-amber-400",
  },
  kalibrasi_overdue: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
  },
  resep_masuk: {
    icon: FilePen,
    bg: "bg-teal-100 dark:bg-teal-900/30",
    color: "text-teal-600 dark:text-teal-400",
  },
  resep_diproses: {
    icon: Stethoscope,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
  },
  invoice_jatuh_tempo: {
    icon: CreditCard,
    bg: "bg-orange-100 dark:bg-orange-900/30",
    color: "text-orange-600 dark:text-orange-400",
  },
};

function getIconConfig(notifType: NotifType): IconConfig {
  return (
    ICON_CONFIG[notifType] ?? {
      icon: Bell,
      bg: "bg-muted",
      color: "text-muted-foreground",
    }
  );
}

// ─── Kategori filter config ────────────────────────────────────────────────────

const NOTIF_KATEGORI_FILTERS = [
  { value: "semua", label: "Semua", icon: LayoutList },
  { value: "stok", label: "Stok", icon: Package },
  { value: "procurement", label: "Procurement", icon: ClipboardList },
  { value: "alkes", label: "Alkes", icon: Stethoscope },
  { value: "sistem", label: "Sistem", icon: Settings },
];

// ─── Time helpers ──────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── NotifItem ─────────────────────────────────────────────────────────────────

function NotifItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: () => void;
}) {
  const router = useRouter();
  const cfg = getIconConfig(notif.notifType);
  const Icon = cfg.icon;

  function handleClick() {
    onRead();
    if (notif.href) router.push(notif.href);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left flex items-start gap-4 px-5 py-4 transition-colors relative",
        "hover:bg-muted/50",
        !notif.read && "bg-primary/[0.03]"
      )}
    >
      {/* Unread stripe */}
      {!notif.read && (
        <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-primary" />
      )}

      {/* Unread dot */}
      <div className="flex-shrink-0 mt-[18px]">
        <div
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            notif.read ? "bg-transparent" : "bg-primary"
          )}
        />
      </div>

      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          cfg.bg
        )}
      >
        <Icon className={cn("h-5 w-5", cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              notif.read
                ? "text-muted-foreground font-medium"
                : "font-semibold text-foreground"
            )}
          >
            {notif.title}
          </p>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>
        {notif.href && (
          <span className="text-xs text-primary mt-1 inline-flex items-center gap-1 hover:underline">
            Lihat detail
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </button>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <BellOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Tidak ada notifikasi yang sesuai filter yang dipilih.
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NotifikasiPage() {
  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();
  const user = useAuthStore((s) => s.user);

  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [search, setSearch] = useState("");

  // Filter by role
  const roleNotifs = useMemo(
    () =>
      notifications.filter((n) =>
        n.targetRoles.includes(
          (user?.role as "admin" | "apoteker") ?? "apoteker"
        )
      ),
    [notifications, user?.role]
  );

  // Apply status + kategori + search filters
  const filtered = useMemo(() => {
    return roleNotifs.filter((n) => {
      const statusOk =
        filterStatus === "semua" ||
        (filterStatus === "belum_dibaca" ? !n.read : n.read);
      const kategoriOk =
        filterKategori === "semua" ||
        getNotifKategori(n.notifType) === filterKategori;
      const searchOk =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());
      return statusOk && kategoriOk && searchOk;
    });
  }, [roleNotifs, filterStatus, filterKategori, search]);

  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifikasi"
        description="Semua pemberitahuan sistem untuk akun Anda"
      />

      <div className="flex gap-6">
        {/* ── SIDEBAR KIRI ────────────────────────────────── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">

            {/* Status */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Status
              </p>
              <nav className="space-y-0.5">
                {[
                  {
                    value: "semua",
                    label: "Semua",
                    count: roleNotifs.length,
                  },
                  {
                    value: "belum_dibaca",
                    label: "Belum Dibaca",
                    count: roleNotifs.filter((n) => !n.read).length,
                  },
                  {
                    value: "sudah_dibaca",
                    label: "Sudah Dibaca",
                    count: roleNotifs.filter((n) => n.read).length,
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilterStatus(item.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      filterStatus === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md",
                        filterStatus === item.value
                          ? "bg-primary/20 text-primary font-medium"
                          : "bg-muted text-muted-foreground",
                        item.value === "belum_dibaca" &&
                          item.count > 0 &&
                          filterStatus !== item.value
                          ? "!bg-destructive/10 !text-destructive font-medium"
                          : ""
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            {/* Kategori */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Kategori
              </p>
              <nav className="space-y-0.5">
                {NOTIF_KATEGORI_FILTERS.map((item) => {
                  const count =
                    item.value === "semua"
                      ? roleNotifs.length
                      : roleNotifs.filter(
                          (n) => getNotifKategori(n.notifType) === item.value
                        ).length;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.value}
                      onClick={() => setFilterKategori(item.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        filterKategori === item.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-md",
                          filterKategori === item.value
                            ? "bg-primary/20 text-primary font-medium"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Separator />

            {/* Aksi cepat */}
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                Tandai Semua Dibaca
              </Button>
            </div>
          </div>
        </aside>

        {/* ── KONTEN KANAN ────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari notifikasi..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="bg-card border rounded-xl">
              <EmptyState />
            </div>
          ) : (
            <>
              <div className="bg-card border rounded-xl overflow-hidden divide-y divide-border/60">
                {filtered.map((notif) => (
                  <NotifItem
                    key={notif.id}
                    notif={notif}
                    onRead={() => markAsRead(notif.id)}
                  />
                ))}
              </div>

              {/* Footer count */}
              <div className="border-t border-border/50 pt-2">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} notifikasi ditampilkan ·{" "}
                  {filtered.filter((n) => !n.read).length} belum dibaca
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
