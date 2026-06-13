import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusVariant = "filled" | "outline";

interface StatusConfig {
  label: string;
  className: string;
  outlineClassName: string;
}

// Normalize: accepts both "MENUNGGU_INPUT" (backend) and "menunggu_input" (ui)
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ── Stok level (UI-derived) ───────────────────────────────────────────────
  aman: {
    label: "Aman",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },
  menipis: {
    label: "Menipis",
    className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
    outlineClassName: "border-amber-500 text-amber-700 dark:text-amber-400",
  },
  kritis: {
    label: "Kritis",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
  quarantine: {
    label: "Karantina",
    className: "bg-orange-100 text-orange-700 border-transparent dark:bg-orange-900/30 dark:text-orange-400",
    outlineClassName: "border-orange-500 text-orange-700 dark:text-orange-400",
  },
  defekta: {
    label: "Defekta",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
  kadaluarsa: {
    label: "Kadaluarsa",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
  aktif: {
    label: "Aktif",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },

  // ── GR Status ─────────────────────────────────────────────────────────────
  menunggu_input: {
    label: "Menunggu Input",
    className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400",
    outlineClassName: "border-blue-500 text-blue-700 dark:text-blue-400",
  },
  menunggu_review: {
    label: "Menunggu Review",
    className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
    outlineClassName: "border-amber-500 text-amber-700 dark:text-amber-400",
  },
  ditolak: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
  selesai: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },

  // ── PO Status ─────────────────────────────────────────────────────────────
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 border-transparent dark:bg-gray-800 dark:text-gray-400",
    outlineClassName: "border-gray-400 text-gray-600 dark:text-gray-400",
  },
  sent: {
    label: "Terkirim",
    className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400",
    outlineClassName: "border-blue-500 text-blue-700 dark:text-blue-400",
  },
  partial_received: {
    label: "Diterima Sebagian",
    className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
    outlineClassName: "border-amber-500 text-amber-700 dark:text-amber-400",
  },
  received: {
    label: "Diterima",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },
  invoiced: {
    label: "Diinvoice",
    className: "bg-purple-100 text-purple-700 border-transparent dark:bg-purple-900/30 dark:text-purple-400",
    outlineClassName: "border-purple-500 text-purple-700 dark:text-purple-400",
  },
  paid: {
    label: "Lunas",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },

  // ── Invoice Status ────────────────────────────────────────────────────────
  unpaid: {
    label: "Belum Dibayar",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
  partial: {
    label: "Dibayar Sebagian",
    className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
    outlineClassName: "border-amber-500 text-amber-700 dark:text-amber-400",
  },

  // ── Supplier Status ───────────────────────────────────────────────────────
  tidak_aktif: {
    label: "Tidak Aktif",
    className: "bg-gray-100 text-gray-600 border-transparent dark:bg-gray-800 dark:text-gray-400",
    outlineClassName: "border-gray-400 text-gray-600 dark:text-gray-400",
  },

  // ── Approval / Generic ────────────────────────────────────────────────────
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900/30 dark:text-amber-400",
    outlineClassName: "border-amber-500 text-amber-700 dark:text-amber-400",
  },
  approved: {
    label: "Disetujui",
    className: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900/30 dark:text-emerald-400",
    outlineClassName: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },

  // ── Alkes Status ──────────────────────────────────────────────────────────
  perbaikan: {
    label: "Dalam Perbaikan",
    className: "bg-orange-100 text-orange-700 border-transparent dark:bg-orange-900/30 dark:text-orange-400",
    outlineClassName: "border-orange-500 text-orange-700 dark:text-orange-400",
  },
  kalibrasi: {
    label: "Sedang Dikalibrasi",
    className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400",
    outlineClassName: "border-blue-500 text-blue-700 dark:text-blue-400",
  },

  // ── Kalibrasi Record Status ───────────────────────────────────────────────
  terjadwal: {
    label: "Terjadwal",
    className: "bg-blue-100 text-blue-700 border-transparent dark:bg-blue-900/30 dark:text-blue-400",
    outlineClassName: "border-blue-500 text-blue-700 dark:text-blue-400",
  },
  terlambat: {
    label: "Terlambat",
    className: "bg-red-100 text-red-700 border-transparent dark:bg-red-900/30 dark:text-red-400",
    outlineClassName: "border-red-500 text-red-700 dark:text-red-400",
  },
};

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant = "filled", className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const config = STATUS_CONFIG[key];

  if (!config) {
    return (
      <Badge
        className={cn(
          "bg-gray-100 text-gray-600 border-transparent dark:bg-gray-800 dark:text-gray-400",
          className
        )}
      >
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        variant === "outline" ? config.outlineClassName : config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
