"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FilePen,
  Package,
  PackageCheck,
  ShoppingCart,
  Stethoscope,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notification-store";
import type { Notification, NotifType } from "@/store/notification-store";
import { useAuthStore } from "@/store/auth-store";

// ─── Type config ──────────────────────────────────────────────────────────────

interface NotifTypeConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  dotColor: string;
}

const TYPE_CONFIG: Record<NotifType, NotifTypeConfig> = {
  stok_kritis: {
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  ed_mendekat: {
    icon: Clock,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  gr_perlu_input: {
    icon: Package,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  gr_ditolak: {
    icon: XCircle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  gr_disetujui: {
    icon: PackageCheck,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  defekta_approved: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  defekta_rejected: {
    icon: XCircle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  po_diterima: {
    icon: ShoppingCart,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    dotColor: "bg-primary",
  },
  kalibrasi_jatuh_tempo: {
    icon: Wrench,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  resep_masuk: {
    icon: FilePen,
    iconBg: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    dotColor: "bg-teal-500",
  },
  resep_diproses: {
    icon: Stethoscope,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  defekta_pending: {
    icon: AlertCircle,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  kalibrasi_overdue: {
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  invoice_jatuh_tempo: {
    icon: CreditCard,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
};

function getConfig(notifType: NotifType): NotifTypeConfig {
  return (
    TYPE_CONFIG[notifType] ?? {
      icon: Bell,
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      dotColor: "bg-muted-foreground",
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

// ─── Notification item ────────────────────────────────────────────────────────

interface NotifItemProps {
  notif: Notification;
  onAction: (id: string, href?: string) => void;
  onRemove: (id: string) => void;
}

const NotifItem = ({ notif, onAction, onRemove }: NotifItemProps) => {
  const cfg = getConfig(notif.notifType);
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer gap-3 px-4 py-3.5 transition-colors",
        !notif.read
          ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
          : "hover:bg-muted/60"
      )}
      role="button"
      tabIndex={0}
      aria-label={notif.title}
      onClick={() => onAction(notif.id, notif.href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAction(notif.id, notif.href);
      }}
    >
      {/* Unread left bar */}
      {!notif.read && (
        <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          cfg.iconBg
        )}
      >
        <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        {!notif.read && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-background",
              cfg.dotColor
            )}
          />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            !notif.read
              ? "font-semibold text-foreground"
              : "font-medium text-muted-foreground"
          )}
        >
          {notif.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {notif.message}
        </p>
        <p
          className={cn(
            "mt-1 text-[10px] font-medium",
            !notif.read ? "text-primary" : "text-muted-foreground/70"
          )}
        >
          {relativeTime(notif.createdAt)}
        </p>
      </div>

      {/* Dismiss */}
      <button
        className="absolute right-3 top-3 hidden rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:flex"
        aria-label="Hapus notifikasi"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notif.id);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center gap-2 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <BellOff className="h-5 w-5 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-muted-foreground">
      Tidak ada notifikasi
    </p>
    <p className="text-xs text-muted-foreground/70">
      Semua notifikasi akan muncul di sini
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { notifications, isLoaded, loadNotifications, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();

  useEffect(() => {
    if (!isLoaded) {
      loadNotifications();
    }
  }, [isLoaded, loadNotifications]);

  // Reload when dropdown opens
  useEffect(() => {
    if (open) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Filter by current user's role, then sort: unread first, then by date desc
  const sorted = [...notifications]
    .filter((n) => n.targetRoles.includes(user?.role as "admin" | "apoteker"))
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const roleUnreadCount = sorted.filter((n) => !n.read).length;

  const handleNotifAction = (id: string, href?: string) => {
    markAsRead(id);
    setOpen(false);
    if (href) router.push(href);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    router.push("/admin/audit-log");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ── Bell trigger ──────────────────────────────────────────────────── */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative text-muted-foreground"
          aria-label={
            roleUnreadCount > 0
              ? `Notifikasi, ${roleUnreadCount} belum dibaca`
              : "Notifikasi"
          }
        >
          <Bell className="h-10 w-10" />
          {roleUnreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white"
            >
              {roleUnreadCount > 9 ? "9+" : roleUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <PopoverContent
        className="w-[380px] p-0 shadow-xl z-[9999] flex flex-col overflow-hidden"
        style={{ maxHeight: "min(520px, calc(100vh - 80px))" }}
        align="end"
        sideOffset={8}
        collisionPadding={16}
      >
        {/* Header — selalu terlihat, tidak ikut scroll */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Notifikasi
            </h3>
            {roleUnreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] px-1.5 text-[11px] font-bold"
              >
                {roleUnreadCount} baru
              </Badge>
            )}
          </div>
          {roleUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3" />
              Tandai semua
            </Button>
          )}
        </div>

        {/* List — scrollable, mengisi sisa tinggi */}
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="divide-y divide-border/60">
              {sorted.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onAction={handleNotifAction}
                  onRemove={removeNotification}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer — selalu terlihat, tidak ikut scroll */}
        {sorted.length > 0 && (
          <>
            <Separator className="shrink-0" />
            <div className="shrink-0 px-4 py-2.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs font-medium text-primary hover:bg-primary/5 hover:text-primary"
                onClick={handleViewAll}
              >
                Lihat semua notifikasi →
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
