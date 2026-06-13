import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifType =
  | "stok_kritis"
  | "ed_mendekat"
  | "gr_perlu_input"
  | "gr_ditolak"
  | "gr_disetujui"
  | "defekta_approved"
  | "defekta_rejected"
  | "po_diterima"
  | "kalibrasi_jatuh_tempo"
  | "resep_masuk"
  | "resep_diproses"
  | "defekta_pending"
  | "kalibrasi_overdue"
  | "invoice_jatuh_tempo";

export interface Notification {
  id: string;
  notifType: NotifType;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
  targetRoles: ("admin" | "apoteker")[];
}

// ─── Mock notifications ───────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001",
    notifType: "stok_kritis",
    type: "error",
    title: "Stok Kritis",
    message: "Paracetamol 500mg hampir habis. Stok tersisa 5 unit.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    href: "/admin/obat",
    targetRoles: ["admin", "apoteker"],
  },
  {
    id: "notif-002",
    notifType: "ed_mendekat",
    type: "warning",
    title: "Expired Date Mendekat",
    message: "Amoxicillin 500mg batch B2024-001 akan kadaluarsa dalam 30 hari.",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    href: "/admin/stok/batch",
    targetRoles: ["admin", "apoteker"],
  },
  {
    id: "notif-003",
    notifType: "gr_disetujui",
    type: "success",
    title: "Good Receipt Disetujui",
    message: "GR-2024-0042 telah disetujui dan stok telah diperbarui.",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    href: "/admin/pembelian/good-receipt",
    targetRoles: ["admin"],
  },
  {
    id: "notif-004",
    notifType: "kalibrasi_jatuh_tempo",
    type: "warning",
    title: "Kalibrasi Jatuh Tempo",
    message: "Tensimeter digital ALK-002 perlu dikalibrasi dalam 7 hari.",
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    href: "/admin/alkes",
    targetRoles: ["admin"],
  },
  {
    id: "notif-005",
    notifType: "defekta_pending",
    type: "info",
    title: "Defekta Menunggu Review",
    message: "Laporan defekta DEF-2024-008 menunggu persetujuan admin.",
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    href: "/admin/defekta",
    targetRoles: ["admin"],
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoaded: boolean;
  loadNotifications: () => Promise<void>;
  addNotification: (notif: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  getForRole: (role: "admin" | "apoteker") => Notification[];
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoaded: false,

  loadNotifications: async () => {
    await new Promise((r) => setTimeout(r, 200));
    const notifications = [...MOCK_NOTIFICATIONS];
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      isLoaded: true,
    });
  },

  addNotification: (notif) =>
    set((s) => {
      const next: Notification = {
        ...notif,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      return {
        notifications: [next, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      };
    }),

  markAsRead: (id) => {
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      if (!target || target.read) return s;
      return {
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount:
          target && !target.read
            ? Math.max(0, s.unreadCount - 1)
            : s.unreadCount,
      };
    }),

  getForRole: (role) =>
    get().notifications.filter((n) => n.targetRoles.includes(role)),
}));
