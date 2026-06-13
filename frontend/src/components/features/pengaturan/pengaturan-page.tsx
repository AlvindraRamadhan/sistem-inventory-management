"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button }    from "@/components/ui/button"
import { Switch }    from "@/components/ui/switch"
import { Badge }     from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sun, Moon, Monitor, Bell, Mail, Shield,
  Info, Package, LogOut, Globe, Save,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark" | "system"

export function PengaturanPage() {
  const { user, logout }        = useAuthStore()
  const { theme, setTheme }     = useTheme()
  const [mounted, setMounted]   = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [notifStokKritis, setNotifStokKritis] = useState(true)
  const [notifEDMendekat, setNotifEDMendekat] = useState(true)
  const [notifGR,         setNotifGR]         = useState(true)
  const [notifDefekta,    setNotifDefekta]    = useState(true)
  const [notifKalibrasi,  setNotifKalibrasi]  = useState(true)
  const [notifEmail,      setNotifEmail]      = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setIsSaving(false)
    toast.success("Pengaturan berhasil disimpan.")
  }

  const handleLogoutAll = () => {
    toast.info("Semua sesi aktif telah diakhiri.")
    logout()
  }

  const notifItems = [
    {
      id: "stok-kritis",
      label: "Stok Kritis",
      desc: "Notifikasi saat stok obat menyentuh batas minimum",
      value: notifStokKritis,
      set: setNotifStokKritis,
      isEmail: false,
      roles: ["admin", "apoteker"],
    },
    {
      id: "ed-mendekat",
      label: "Expired Date Mendekat",
      desc: "Notifikasi saat obat akan kadaluarsa dalam 30 hari",
      value: notifEDMendekat,
      set: setNotifEDMendekat,
      isEmail: false,
      roles: ["admin", "apoteker"],
    },
    {
      id: "good-receipt",
      label: "Good Receipt",
      desc: "Notifikasi saat ada GR yang perlu ditindaklanjuti",
      value: notifGR,
      set: setNotifGR,
      isEmail: false,
      roles: ["admin", "apoteker"],
    },
    {
      id: "defekta",
      label: "Laporan Defekta",
      desc: "Notifikasi saat ada laporan defekta baru atau diproses",
      value: notifDefekta,
      set: setNotifDefekta,
      isEmail: false,
      roles: ["admin", "apoteker"],
    },
    {
      id: "kalibrasi",
      label: "Kalibrasi Alkes",
      desc: "Pengingat kalibrasi alat kesehatan H-30",
      value: notifKalibrasi,
      set: setNotifKalibrasi,
      isEmail: false,
      roles: ["admin", "apoteker"],
    },
    {
      id: "email",
      label: "Notifikasi via Email",
      desc: "Kirim ringkasan notifikasi kritis ke email",
      value: notifEmail,
      set: setNotifEmail,
      isEmail: true,
      roles: ["admin"],
    },
  ].filter((item) => item.roles.includes(user?.role ?? "apoteker"))

  const THEME_OPTIONS = [
    { value: "light"  as Theme, label: "Terang", Icon: Sun     },
    { value: "dark"   as Theme, label: "Gelap",  Icon: Moon    },
    { value: "system" as Theme, label: "Sistem", Icon: Monitor },
  ]

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sesuaikan preferensi dan tampilan aplikasi
        </p>
      </div>

      {/* ── Layout 2 kolom ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* ════════ KOLOM KIRI ════════ */}
        <div className="space-y-4">

          {/* Card: Tampilan */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" />
                Tampilan
              </CardTitle>
              <CardDescription>
                Atur tema warna dan bahasa antarmuka
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Pilih tema */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Tema Aplikasi</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map(({ value, label, Icon }) => {
                    const isActive = mounted ? theme === value : value === "light"
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setTheme(value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {mounted && (
                  <p className="text-xs text-muted-foreground">
                    {theme === "light"  && "Mode terang aktif"}
                    {theme === "dark"   && "Mode gelap aktif"}
                    {theme === "system" && "Mengikuti pengaturan sistem"}
                  </p>
                )}
              </div>

              <Separator />

              {/* Bahasa */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Bahasa</p>
                    <p className="text-xs text-muted-foreground">
                      Bahasa antarmuka aplikasi
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Bahasa Indonesia
                </Badge>
              </div>

            </CardContent>
          </Card>

          {/* Card: Tentang Aplikasi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Tentang Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-200">
                  <Package className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold text-sm">Smart Clinic Inventory</p>
                  <p className="text-xs text-muted-foreground">
                    Sistem Manajemen Inventaris Farmasi
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">v1.0.0</Badge>
                    <span className="text-xs text-muted-foreground">
                      © 2025 Smart Clinic System
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ════════ KOLOM KANAN ════════ */}
        <div className="space-y-6">

          {/* Card: Preferensi Notifikasi */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Preferensi Notifikasi
              </CardTitle>
              <CardDescription>
                Atur jenis notifikasi yang ingin Anda terima
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {notifItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.isEmail
                        ? <Mail className="h-4 w-4 text-muted-foreground" />
                        : <Bell className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    id={item.id}
                    checked={item.value}
                    onCheckedChange={item.set}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card: Sesi & Keamanan */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Sesi & Keamanan
              </CardTitle>
              <CardDescription>
                Kelola sesi aktif dan keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sesi Aktif Saat Ini
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Perangkat ini</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Browser Web · Login sekarang
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs border-0">
                    Aktif
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium">Keluar dari Semua Perangkat</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mengakhiri semua sesi aktif di seluruh perangkat
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive flex-shrink-0"
                  onClick={handleLogoutAll}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar Semua
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Tombol Simpan */}
          <div className="flex justify-end pb-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary gap-1.5 min-w-[160px]"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
