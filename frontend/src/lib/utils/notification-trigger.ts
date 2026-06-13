// Utility functions that add notifications to the global store.
// Call these after state-changing actions — they are not hooks.
// Uses Zustand's getState() to access the store outside React components.

import { useNotificationStore } from "@/store/notification-store";
import type { Obat, Batch } from "@/types/inventory";
import type { Alkes } from "@/types/alkes";

// ─── Internal helpers ──────────────────────────────────────────────────────────

function addNotif(...args: Parameters<ReturnType<typeof useNotificationStore.getState>["addNotification"]>) {
  useNotificationStore.getState().addNotification(...args);
}

/** Prevent duplicate notifications by checking the title. */
function isDuplicate(title: string): boolean {
  return useNotificationStore.getState().notifications.some((n) => n.title === title);
}

// ─── Stok kritis ───────────────────────────────────────────────────────────────

/**
 * Called after every stok-keluar transaction.
 * Adds a stok_kritis notification when the remaining stock hits or drops below
 * the configured minimum threshold.
 */
export function triggerStokKritisAlert(obat: Obat, stokSaatIni: number): void {
  if (stokSaatIni > obat.stokMinimal) return;

  const title = `Stok Kritis — ${obat.nama}`;
  if (isDuplicate(title)) return;

  addNotif({
    notifType: "stok_kritis",
    type: "warning",
    title,
    message: `Stok tersisa ${stokSaatIni} ${obat.satuanNama?.toLowerCase() ?? "unit"}, di bawah batas minimum (${obat.stokMinimal}). Segera lakukan restok.`,
    href: "/admin/master-data/obat",
    targetRoles: ["admin", "apoteker"],
  });
}

// ─── Expired date (ED) alert ───────────────────────────────────────────────────

/**
 * Called on dashboard load.
 * Scans all active batches and generates an ed_mendekat notification for every
 * batch expiring within the threshold window (default 30 days).
 * Deduplicates by batch-specific title so re-renders don't flood the list.
 */
export function triggerEDAlert(batches: Batch[], thresholdDays = 30): void {
  const now = Date.now();
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  batches
    .filter((b) => {
      if (b.status !== "AKTIF" || b.qty <= 0) return false;
      const msLeft = new Date(b.expiredDate).getTime() - now;
      return msLeft > 0 && msLeft <= thresholdMs;
    })
    .forEach((b) => {
      const daysLeft = Math.ceil(
        (new Date(b.expiredDate).getTime() - now) / (1000 * 60 * 60 * 24)
      );
      const title = `Mendekati Kadaluarsa — ${b.namaObat} (${b.batchNumber})`;
      if (isDuplicate(title)) return;

      addNotif({
        notifType: "ed_mendekat",
        type: "warning",
        title,
        message: `Batch ${b.batchNumber} akan kadaluarsa dalam ${daysLeft} hari. Qty: ${b.qty} unit di ${b.lokasiNama ?? "gudang"}.`,
        href: "/admin/master-data/batch-tracking",
        targetRoles: ["admin"],
      });
    });
}

// ─── Good Receipt ──────────────────────────────────────────────────────────────

/**
 * Called whenever a Good Receipt status changes.
 *
 * @param grId         - GR document ID (used to build the detail href)
 * @param grNo         - Human-readable GR number (e.g. "GR/2026/042")
 * @param supplierNama - Supplier display name
 * @param targetRole   - Which role should see this notification
 * @param eventType    - The transition event
 */
export function triggerGRNotif(
  grId: string,
  grNo: string,
  supplierNama: string,
  targetRole: "apoteker" | "admin",
  eventType: "perlu_input" | "perlu_review" | "disetujui" | "ditolak"
): void {
  const hrefBase =
    targetRole === "apoteker"
      ? `/apoteker/good-receipt/${grId}`
      : `/admin/procurement/good-receipt/${grId}`;

  type NotifConfig = Parameters<typeof addNotif>[0];

  const configs: Record<typeof eventType, NotifConfig> = {
    perlu_input: {
      notifType: "gr_perlu_input",
      type: "info",
      title: "Good Receipt Perlu Diolah",
      message: `${grNo} dari ${supplierNama} menunggu verifikasi fisik oleh apoteker.`,
      href: hrefBase,
      targetRoles: [targetRole],
    },
    perlu_review: {
      notifType: "gr_perlu_input",
      type: "info",
      title: "Good Receipt Perlu Direview",
      message: `${grNo} dari ${supplierNama} menunggu persetujuan admin.`,
      href: hrefBase,
      targetRoles: [targetRole],
    },
    disetujui: {
      notifType: "gr_disetujui",
      type: "success",
      title: "Good Receipt Disetujui",
      message: `${grNo} dari ${supplierNama} telah disetujui. Stok sudah diperbarui secara otomatis.`,
      href: hrefBase,
      targetRoles: [targetRole],
    },
    ditolak: {
      notifType: "gr_ditolak",
      type: "error",
      title: "Good Receipt Ditolak",
      message: `${grNo} dari ${supplierNama} ditolak oleh admin. Periksa catatan penolakan.`,
      href: hrefBase,
      targetRoles: [targetRole],
    },
  };

  addNotif(configs[eventType]);
}

// ─── Kalibrasi alert ───────────────────────────────────────────────────────────

/**
 * Called on Alkes page load.
 * Generates kalibrasi_jatuh_tempo or kalibrasi_overdue notifications for
 * equipment that is due within thresholdDays or already overdue.
 */
export function triggerKalibrasiAlert(alkesItems: Alkes[], thresholdDays = 30): void {
  const now = Date.now();
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  alkesItems
    .filter((a) => a.status === "AKTIF" && a.tanggalKalibrasiSelanjutnya)
    .forEach((a) => {
      const nextDate = a.tanggalKalibrasiSelanjutnya!;
      const msLeft = new Date(nextDate).getTime() - now;
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      const isOverdue = daysLeft < 0;
      const isDueSoon = !isOverdue && msLeft <= thresholdMs;

      if (!isOverdue && !isDueSoon) return;

      const title = isOverdue
        ? `Kalibrasi Terlambat — ${a.nama}`
        : `Kalibrasi Jatuh Tempo — ${a.nama}`;

      if (isDuplicate(title)) return;

      addNotif({
        notifType: isOverdue ? "kalibrasi_overdue" : "kalibrasi_jatuh_tempo",
        type: isOverdue ? "error" : "warning",
        title,
        message: isOverdue
          ? `Kalibrasi ${a.nama} sudah terlambat ${Math.abs(daysLeft)} hari (jadwal: ${nextDate}). Segera jadwalkan kalibrasi ulang.`
          : `Kalibrasi ${a.nama} perlu dilakukan dalam ${daysLeft} hari (${nextDate}).`,
        href: "/admin/alkes",
        targetRoles: ["admin"],
      });
    });
}

// ─── Defekta ───────────────────────────────────────────────────────────────────

/**
 * Called when a defekta report is submitted or its status changes.
 */
export function triggerDefektaNotif(
  defektaId: string,
  namaObat: string,
  eventType: "pending" | "approved" | "rejected"
): void {
  const href = eventType === "pending"
    ? "/admin/defekta"
    : "/apoteker/defekta";

  type NotifConfig = Parameters<typeof addNotif>[0];

  const configs: Record<typeof eventType, NotifConfig> = {
    pending: {
      notifType: "defekta_pending",
      type: "warning",
      title: "Laporan Defekta Baru",
      message: `Laporan defekta untuk ${namaObat} (${defektaId}) menunggu persetujuan admin.`,
      href,
      targetRoles: ["admin"] as ("admin" | "apoteker")[],
    },
    approved: {
      notifType: "defekta_approved",
      type: "success",
      title: "Laporan Defekta Disetujui",
      message: `Laporan defekta ${namaObat} (${defektaId}) disetujui. Batch akan dikeluarkan dari stok.`,
      href,
      targetRoles: ["apoteker"] as ("admin" | "apoteker")[],
    },
    rejected: {
      notifType: "defekta_rejected",
      type: "error",
      title: "Laporan Defekta Ditolak",
      message: `Laporan defekta ${namaObat} (${defektaId}) ditolak. Periksa alasan penolakan di halaman Defekta.`,
      href,
      targetRoles: ["apoteker"] as ("admin" | "apoteker")[],
    },
  };

  addNotif(configs[eventType]);
}

// ─── Invoice jatuh tempo ───────────────────────────────────────────────────────

/**
 * Called when an invoice due date is approaching (< 7 days) or overdue.
 */
export function triggerInvoiceAlert(
  invoiceNo: string,
  supplierNama: string,
  jatuhTempo: string,
  nilaiTagihan: number
): void {
  const title = `Invoice Jatuh Tempo — ${invoiceNo}`;
  if (isDuplicate(title)) return;

  const daysLeft = Math.ceil(
    (new Date(jatuhTempo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  addNotif({
    notifType: "invoice_jatuh_tempo",
    type: daysLeft < 0 ? "error" : "warning",
    title,
    message: `Invoice ${invoiceNo} dari ${supplierNama} senilai Rp ${nilaiTagihan.toLocaleString("id-ID")} ${daysLeft < 0 ? `sudah terlambat ${Math.abs(daysLeft)} hari` : `jatuh tempo dalam ${daysLeft} hari`} (${jatuhTempo}).`,
    href: "/admin/procurement/invoice",
    targetRoles: ["admin"],
  });
}
