"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Pill,
  Tag,
  MapPin,
  CalendarClock,
  Truck,
  ShoppingCart,
  PackageCheck,
  Receipt,
  PackageX,
  Stethoscope,
  BarChart3,
  FileBarChart2,
  ShieldAlert,
  ClipboardList,
  PackagePlus,
  PackageMinus,
  ClipboardCheck,
  ArrowLeftRight,
  Bell,
  FilePen,
  HelpCircle,
  ChevronDown,
  FileCode2,
  type LucideIcon,
} from "lucide-react";

import { useStokOpnameList } from "@/hooks/queries/use-stok-opname";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";
import type { UserRole } from "@/lib/constants/roles";

//  Types 

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: number;
}

interface NavSection {
  section?: string;
  items: NavItem[];
}

//  Navigation config 

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    section: "Manajemen Data",
    items: [
      {
        title: "Master Data",
        icon: Pill,
        children: [
          { title: "Obat", href: ROUTES.ADMIN.MASTER_DATA.OBAT, icon: Pill },
          { title: "Kategori", href: ROUTES.ADMIN.MASTER_DATA.KATEGORI, icon: Tag },
          { title: "Lokasi Gudang", href: ROUTES.ADMIN.MASTER_DATA.LOKASI, icon: MapPin },
          { title: "Batch & Expired", href: ROUTES.ADMIN.MASTER_DATA.BATCH_TRACKING, icon: CalendarClock },
        ],
      },
      { title: "Supplier", href: ROUTES.ADMIN.SUPPLIER, icon: Truck },
    ],
  },
  {
    section: "Pengadaan",
    items: [
      {
        title: "Pengadaan",
        icon: ShoppingCart,
        children: [
          { title: "Purchase Order", href: ROUTES.ADMIN.PROCUREMENT.PO, icon: ShoppingCart },
          { title: "Good Receipt", href: ROUTES.ADMIN.PROCUREMENT.GR, icon: PackageCheck },
          { title: "Invoice", href: ROUTES.ADMIN.PROCUREMENT.INVOICE, icon: Receipt },
        ],
      },
      { title: "Defekta & Quarantine", href: ROUTES.ADMIN.DEFEKTA, icon: PackageX },
      { title: "Validasi Opname", href: ROUTES.ADMIN.OPNAME, icon: ClipboardCheck },
      { title: "Alat Kesehatan", href: ROUTES.ADMIN.ALKES, icon: Stethoscope },
    ],
  },
  {
    section: "Laporan",
    items: [
      {
        title: "Analitik",
        icon: BarChart3,
        children: [
          { title: "Analisis Pareto", href: ROUTES.ADMIN.ANALYTICS.PARETO, icon: BarChart3 },
          { title: "Safety Stock", href: ROUTES.ADMIN.ANALYTICS.SAFETY_STOCK, icon: ShieldAlert },
          { title: "Laporan", href: ROUTES.ADMIN.ANALYTICS.LAPORAN, icon: FileBarChart2 },
        ],
      },
      { title: "Audit Log", href: ROUTES.ADMIN.AUDIT_LOG, icon: ClipboardList },
      { title: "API Docs", href: ROUTES.API_DOCS, icon: FileCode2 },
    ],
  },
  {
    items: [
      { title: "Notifikasi", href: ROUTES.NOTIFIKASI, icon: Bell },
      { title: "Bantuan & Dukungan", href: ROUTES.HELP, icon: HelpCircle },
    ],
  },
];

const APOTEKER_NAV: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: ROUTES.APOTEKER.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    section: "Manajemen Stok",
    items: [
      { title: "Stok Masuk", href: ROUTES.APOTEKER.STOK_MASUK, icon: PackagePlus },
      { title: "Stok Keluar", href: ROUTES.APOTEKER.STOK_KELUAR, icon: PackageMinus },
      { title: "Good Receipt", href: ROUTES.APOTEKER.GOOD_RECEIPT, icon: PackageCheck },
      { title: "Defekta", href: ROUTES.APOTEKER.DEFEKTA, icon: PackageX },
      { title: "Stok Opname", href: ROUTES.APOTEKER.OPNAME, icon: ClipboardCheck },
      { title: "Mutasi Lokasi", href: ROUTES.APOTEKER.MUTASI_LOKASI, icon: ArrowLeftRight },
    ],
  },
  {
    section: "Layanan",
    items: [
      { title: "E-Prescribing", href: ROUTES.APOTEKER.E_PRESCRIBING, icon: FilePen },
      { title: "Alat Kesehatan", href: ROUTES.APOTEKER.ALKES, icon: Stethoscope },
    ],
  },
  {
    items: [
      { title: "Notifikasi", href: ROUTES.NOTIFIKASI, icon: Bell },
      { title: "Bantuan", href: ROUTES.HELP, icon: HelpCircle },
    ],
  },
];

const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin: ADMIN_NAV,
  apoteker: APOTEKER_NAV,
};

//  SidebarNav 

interface SidebarNavProps {
  role: UserRole;
  isCollapsed: boolean;
}

export function SidebarNav({ role, isCollapsed }: SidebarNavProps) {
  const rawSections = NAV_BY_ROLE[role] ?? [];

  const { data: opnameData } = useStokOpnameList({ status: "PENDING", limit: 1 });
  const pendingOpnameCount = opnameData?.meta.total ?? 0;

  const sections = useMemo(() => {
    if (role !== "admin" || pendingOpnameCount === 0) return rawSections;
    return rawSections.map((sec) => ({
      ...sec,
      items: sec.items.map((item) =>
        item.title === "Validasi Opname"
          ? { ...item, badge: pendingOpnameCount }
          : item
      ),
    }));
  }, [rawSections, role, pendingOpnameCount]);

  return (
    <nav aria-label="Menu Navigasi" className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden px-3 py-5 h-full bg-sidebar">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.section && !isCollapsed && (
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.section}
            </p>
          )}
          {section.items.map((item) => (
            <NavItemRow key={item.title} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      ))}
    </nav>
  );
}

//  Shared active styles (white sidebar)

const activeClass =
  "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 rounded-r-lg";
const inactiveClass =
  "text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg border-l-2 border-transparent";

//  NavItemRow 

function NavItemRow({
  item,
  isCollapsed,
  depth = 0,
}: {
  item: NavItem;
  isCollapsed: boolean;
  depth?: number;
}) {
  const pathname = usePathname();
  const hasChildren = Boolean(item.children?.length);

  const isChildActive = hasChildren
    ? item.children!.some((c) => c.href && pathname.startsWith(c.href))
    : false;

  const [open, setOpen] = useState(isChildActive);

  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;

  // ─ Collapsed mode: icon only 
  if (isCollapsed) {
    if (hasChildren) {
      return (
        <>
          {item.children!.map((child) => (
            <CollapsedIconLink key={child.href} item={child} pathname={pathname} />
          ))}
        </>
      );
    }
    return <CollapsedIconLink item={item} pathname={pathname} />;
  }

  //  Expanded: group with accordion 
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-3 text-[15px] font-medium transition-colors",
            "border-l-2 border-transparent rounded-r-lg",
            isChildActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-500"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{item.title}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-60 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-sidebar-border/60 pl-2.5">
            {item.children!.map((child) => (
              <NavItemRow key={child.title} item={child} isCollapsed={false} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  //  Expanded: leaf link
  return (
    <Link
      href={item.href!}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 text-[15px] font-medium transition-colors",
        depth > 0 ? "py-2" : "py-3",
        isActive ? activeClass : inactiveClass
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="truncate flex-1">{item.title}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          aria-label={`${item.badge} menunggu`}
          className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white tabular-nums"
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

//  Collapsed icon link 

function CollapsedIconLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + "/")
    : false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href ?? "#"}
          aria-label={item.title}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "mx-auto flex h-10 w-10 items-center justify-center transition-colors",
            isActive
              ? "bg-emerald-50 text-emerald-700 rounded-r-lg border-l-2 border-emerald-500"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg"
          )}
        >
          <item.icon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}
