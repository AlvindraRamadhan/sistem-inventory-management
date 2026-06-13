import {
  useAuditLogStore,
  type AuditAction,
  type AuditEntityType,
  type AuditLog,
} from "@/store/audit-log-store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { AuditLog, AuditAction, AuditEntityType };

export type LogActionParams = Omit<AuditLog, "id" | "timestamp">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(existing: AuditLog[]): string {
  const nums = existing
    .map((l) => l.id)
    .filter((id) => /^AL-\d+$/.test(id))
    .map((id) => parseInt(id.slice(3)))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `AL-${String(next).padStart(3, "0")}`;
}

function simulateIp(): string {
  const host = Math.floor(Math.random() * 20) + 1;
  return `192.168.1.${host}`;
}

// ─── logAction ────────────────────────────────────────────────────────────────

/**
 * Appends a structured audit entry to the in-memory audit-log store.
 *
 * Call this after every state-mutating action (stok masuk/keluar, defekta,
 * opname, mutasi, approval) so the Audit Log page has a full trail.
 *
 * @example
 * logAction({
 *   userId: user.id, userName: user.name, userRole: user.role,
 *   action: "STOK_KELUAR", entityType: "BATCH", entityId: batch.id,
 *   description: `Stok keluar: ${namaObat} — ${qty} unit`,
 *   before: { qty: prevQty }, after: { qty: newQty },
 * });
 */
export function logAction(params: LogActionParams): void {
  const { logs, addLog } = useAuditLogStore.getState();

  const entry: AuditLog = {
    ...params,
    id: generateId(logs),
    timestamp: new Date().toISOString(),
    ipAddress: params.ipAddress ?? simulateIp(),
  };

  addLog(entry);
}

// ─── Convenience builders ─────────────────────────────────────────────────────
// These enforce a consistent description format per action type.

interface UserCtx {
  userId: string;
  userName: string;
  userRole: string;
}

export function logStokMasuk(
  user: UserCtx,
  opts: {
    entityId: string;
    namaObat: string;
    batchNumber: string;
    qty: number;
    lokasiNama: string;
    sumber: string;
    after?: object;
  }
): void {
  logAction({
    ...user,
    action: "STOK_MASUK",
    entityType: "BATCH",
    entityId: opts.entityId,
    description: `Stok masuk (${opts.sumber}): ${opts.namaObat} (Batch ${opts.batchNumber}) — ${opts.qty.toLocaleString("id-ID")} unit ke ${opts.lokasiNama}`,
    after: opts.after,
  });
}

export function logStokKeluar(
  user: UserCtx,
  opts: {
    entityId: string;
    namaObat: string;
    batchNumber: string;
    qty: number;
    alasan: string;
    referenceId?: string;
    before?: object;
    after?: object;
  }
): void {
  const ref = opts.referenceId ? `, ${opts.referenceId}` : "";
  logAction({
    ...user,
    action: "STOK_KELUAR",
    entityType: "BATCH",
    entityId: opts.entityId,
    description: `Stok keluar: ${opts.namaObat} (Batch ${opts.batchNumber}) — ${opts.qty.toLocaleString("id-ID")} unit. ${opts.alasan}${ref}`,
    before: opts.before,
    after: opts.after,
  });
}

export function logDefektaLapor(
  user: UserCtx,
  opts: {
    entityId: string;
    namaObat: string;
    batchNumber: string;
    qty: number;
    alasan: string;
  }
): void {
  logAction({
    ...user,
    action: "DEFEKTA_LAPOR",
    entityType: "DEFEKTA",
    entityId: opts.entityId,
    description: `Laporan defekta: ${opts.namaObat} (Batch ${opts.batchNumber}) — ${opts.qty.toLocaleString("id-ID")} unit. Alasan: ${opts.alasan}`,
    after: { status: "PENDING" },
  });
}

export function logDefektaApprove(
  user: UserCtx,
  opts: { entityId: string; namaObat: string; batchNumber: string; qty: number }
): void {
  logAction({
    ...user,
    action: "DEFEKTA_APPROVE",
    entityType: "DEFEKTA",
    entityId: opts.entityId,
    description: `Defekta disetujui: ${opts.namaObat} (Batch ${opts.batchNumber}) — ${opts.qty.toLocaleString("id-ID")} unit dimusnahkan`,
    before: { status: "PENDING" },
    after: { status: "APPROVED" },
  });
}

export function logDefektaReject(
  user: UserCtx,
  opts: { entityId: string; namaObat: string; alasan: string }
): void {
  logAction({
    ...user,
    action: "DEFEKTA_REJECT",
    entityType: "DEFEKTA",
    entityId: opts.entityId,
    description: `Defekta ditolak: ${opts.namaObat}. Alasan: ${opts.alasan}`,
    before: { status: "PENDING" },
    after: { status: "REJECTED" },
  });
}

export function logOpnameBuat(
  user: UserCtx,
  opts: { entityId: string; noOpname: string; totalItems: number }
): void {
  logAction({
    ...user,
    action: "OPNAME_BUAT",
    entityType: "OPNAME",
    entityId: opts.entityId,
    description: `Stok opname ${opts.noOpname} dibuat — ${opts.totalItems} item diperiksa`,
    after: { noOpname: opts.noOpname, status: "PENDING", totalItems: opts.totalItems },
  });
}

export function logOpnameApprove(
  user: UserCtx,
  opts: { entityId: string; noOpname: string }
): void {
  logAction({
    ...user,
    action: "OPNAME_APPROVE",
    entityType: "OPNAME",
    entityId: opts.entityId,
    description: `Opname ${opts.noOpname} disetujui dan koreksi stok diterapkan`,
    before: { status: "PENDING" },
    after: { status: "APPROVED" },
  });
}

export function logMutasiLokasi(
  user: UserCtx,
  opts: {
    entityId: string;
    namaObat: string;
    batchNumber: string;
    qty: number;
    dariLokasi: string;
    keLokasi: string;
  }
): void {
  logAction({
    ...user,
    action: "MUTASI_LOKASI",
    entityType: "MUTASI",
    entityId: opts.entityId,
    description: `Mutasi lokasi: ${opts.namaObat} (Batch ${opts.batchNumber}) — ${opts.qty.toLocaleString("id-ID")} unit dari ${opts.dariLokasi} ke ${opts.keLokasi}`,
    before: { lokasiNama: opts.dariLokasi },
    after: { lokasiNama: opts.keLokasi },
  });
}
