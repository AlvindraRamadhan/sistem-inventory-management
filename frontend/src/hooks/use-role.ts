"use client";

import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/auth";

//  Feature Access Matrix 
// Maps feature keys to the roles that are allowed to access them.
// Keep in sync with the PRD Role Access Matrix.

const ACCESS_MATRIX = {
  //  Stock management 
  "stok.masuk":            ["apoteker"],
  "stok.keluar":           ["apoteker"],
  "stok.opname.input":     ["apoteker"],
  "stok.opname.approve":   ["admin"],
  "mutasi.lokasi":         ["apoteker"],

  //  Defekta 
  "defekta.input":         ["apoteker"],
  "defekta.approve":       ["admin"],

  //  Procurement 
  "po.create":             ["admin"],
  "gr.input":              ["apoteker"],
  "gr.approve":            ["admin"],
  "invoice.manage":        ["admin"],

  //  Supplier 
  "supplier.crud":         ["admin"],

  //  Master data 
  "master_data.crud":      ["admin"],

  //  Alkes 
  "alkes.crud":            ["admin"],
  "alkes.kalibrasi.input": ["apoteker"],

  //  Analytics & Audit 
  "analytics.view":        ["admin"],
  "audit.full":            ["admin"],
  "audit.limited":         ["apoteker"],

  //  E-Prescribing
  "e_prescribing.view":    ["apoteker"],
} satisfies Record<string, UserRole[]>;

export type AccessFeature = keyof typeof ACCESS_MATRIX;

//  Simple role checks 

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === "admin") ?? false;
}

export function useIsApoteker(): boolean {
  return useAuthStore((s) => s.user?.role === "apoteker") ?? false;
}

//  Feature-based access check 
// useCanAccess('po.create')   → true only for admin
// useCanAccess('e_prescribing.view') → true for apoteker & dokter

export function useCanAccess(feature: AccessFeature): boolean {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return false;
  return (ACCESS_MATRIX[feature] as UserRole[]).includes(role);
}
