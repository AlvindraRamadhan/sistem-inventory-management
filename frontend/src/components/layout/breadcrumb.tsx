"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ─── Segment label map ────────────────────────────────────────────────────────
// Maps URL segment → display label.
// "dashboard" at any depth shows "Beranda" so both admin & apoteker root works.

const SEGMENT_LABELS: Record<string, string> = {
  // Root
  dashboard: "Beranda",

  // Master Data
  "master-data": "Master Data",
  obat: "Katalog Obat",
  kategori: "Kategori Obat",
  lokasi: "Lokasi Penyimpanan",

  // Procurement
  procurement: "Pengadaan",
  "purchase-order": "Purchase Order",
  "good-receipt": "Good Receipt",
  invoice: "Invoice",

  // Inventory
  "stok-masuk": "Stok Masuk",
  "stok-keluar": "Stok Keluar",
  opname: "Stock Opname",
  "mutasi-lokasi": "Mutasi Lokasi",

  // Clinical
  "e-prescribing": "E-Prescribing",
  defekta: "Defekta",
  alkes: "Alat Kesehatan",
  supplier: "Supplier",

  // Analytics
  analytics: "Analitik",
  pareto: "Analisis Pareto",
  laporan: "Laporan",

  // Admin
  "audit-log": "Audit Log",
};

// ─── Full-path overrides ──────────────────────────────────────────────────────
// For paths where the generated label from segments isn't specific enough.
// Key: normalized path (without leading role prefix, no trailing slash).

const PATH_OVERRIDES: Record<string, Array<{ label: string; href?: string }>> = {
  "/admin/dashboard": [{ label: "Beranda" }],
  "/apoteker/dashboard": [{ label: "Beranda" }],

  "/admin/master-data/obat": [
    { label: "Master Data", href: "" },
    { label: "Katalog Obat" },
  ],
  "/admin/master-data/kategori": [
    { label: "Master Data", href: "" },
    { label: "Kategori Obat" },
  ],
  "/admin/master-data/lokasi": [
    { label: "Master Data", href: "" },
    { label: "Lokasi Penyimpanan" },
  ],

  "/admin/procurement/purchase-order": [
    { label: "Pengadaan", href: "" },
    { label: "Purchase Order" },
  ],
  "/admin/procurement/good-receipt": [
    { label: "Pengadaan", href: "" },
    { label: "Good Receipt" },
  ],
  "/admin/procurement/invoice": [
    { label: "Pengadaan", href: "" },
    { label: "Invoice" },
  ],

  "/apoteker/good-receipt": [{ label: "Good Receipt" }],
  "/apoteker/stok-masuk": [{ label: "Stok Masuk" }],
  "/apoteker/stok-keluar": [{ label: "Stok Keluar" }],
  "/apoteker/opname": [{ label: "Stock Opname" }],
  "/apoteker/mutasi-lokasi": [{ label: "Mutasi Lokasi" }],
  "/apoteker/defekta": [{ label: "Defekta" }],
  "/apoteker/e-prescribing": [{ label: "E-Prescribing" }],
  "/apoteker/alkes": [{ label: "Alat Kesehatan" }],

  "/admin/analytics/pareto": [
    { label: "Analitik", href: "" },
    { label: "Analisis Pareto" },
  ],
  "/admin/analytics/laporan": [
    { label: "Analitik", href: "" },
    { label: "Laporan" },
  ],

  "/admin/defekta": [{ label: "Defekta" }],
  "/admin/alkes": [{ label: "Alat Kesehatan" }],
  "/admin/supplier": [{ label: "Supplier" }],
  "/admin/audit-log": [{ label: "Audit Log" }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_SEGMENTS = new Set(["admin", "apoteker"]);

function labelFor(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface CrumbItem {
  label: string;
  href?: string;
  isLast: boolean;
}

function buildCrumbs(pathname: string): CrumbItem[] {
  // Check full-path override first
  const override = PATH_OVERRIDES[pathname];
  if (override) {
    return override.map((item, i, arr) => ({
      label: item.label,
      href: item.href !== undefined ? item.href || undefined : undefined,
      isLast: i === arr.length - 1,
    }));
  }

  // Fallback: build from URL segments, skip role segments
  const allSegments = pathname.split("/").filter(Boolean);
  const meaningful = allSegments.filter((seg) => !ROLE_SEGMENTS.has(seg));

  return meaningful.map((seg, i, arr) => {
    const segIdx = allSegments.indexOf(seg, i);
    return {
      label: labelFor(seg),
      href: "/" + allSegments.slice(0, segIdx + 1).join("/"),
      isLast: i === arr.length - 1,
    };
  });
}

//  Component 

export function AppBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList className="text-xl gap-2">
        {crumbs.map((crumb, i) => (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <BreadcrumbSeparator className="[&>svg]:size-6" />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <span className="text-muted-foreground">{crumb.label}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
