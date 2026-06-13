"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Pencil,
  Save,
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

const infoSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  unit: z.string().optional(),
})

const passSchema = z
  .object({
    oldPassword: z.string().min(6, "Password lama minimal 6 karakter"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })

type InfoValues = z.infer<typeof infoSchema>
type PassValues = z.infer<typeof passSchema>

export const ProfilPage = () => {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfPass, setShowConfPass] = useState(false)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isSavingPass, setIsSavingPass] = useState(false)

  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() ?? "??"

  const avatarColor =
    user?.role === "admin" ? "bg-emerald-500" : "bg-blue-500"

  const infoForm = useForm<InfoValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: "",
      unit: user?.unit ?? "",
    },
  })

  const passForm = useForm<PassValues>({
    resolver: zodResolver(passSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  })

  const handleSaveInfo = async (_data: InfoValues) => {
    setIsSavingInfo(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsSavingInfo(false)
    setIsEditing(false)
    toast.success("Informasi profil berhasil diperbarui.")
  }

  const handleSavePassword = async (data: PassValues) => {
    setIsSavingPass(true)
    await new Promise((r) => setTimeout(r, 800))
    const correctOld = user?.role === "admin" ? "admin123" : "apotek123"
    if (data.oldPassword !== correctOld) {
      passForm.setError("oldPassword", { message: "Password lama tidak benar" })
      setIsSavingPass(false)
      return
    }
    setIsSavingPass(false)
    passForm.reset()
    toast.success("Password berhasil diubah.")
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    infoForm.reset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola informasi akun dan keamanan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* ── Kolom Kiri — Kartu Profil ── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center mb-4",
                    "text-white text-2xl font-bold shadow-lg",
                    avatarColor
                  )}
                >
                  {initials}
                </div>

                <h2 className="text-lg font-bold leading-tight">{user?.name}</h2>

                <Badge
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    user?.role === "admin"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {user?.role === "admin" ? "Administrator" : "Apoteker"}
                </Badge>

                <Separator className="my-4 w-full" />

                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">{user?.unit ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">
                      {user?.role === "admin"
                        ? "Hak Akses Penuh"
                        : "Hak Akses Operasional"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Aktivitas Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  icon: Clock,
                  label: "Login terakhir",
                  value: format(new Date(), "dd MMM yyyy, HH:mm", { locale: id }),
                  valueClass: "",
                },
                {
                  icon: CheckCircle2,
                  label: "Status akun",
                  value: "Aktif",
                  valueClass: "text-emerald-600 font-semibold",
                },
                {
                  icon: CalendarDays,
                  label: "Bergabung sejak",
                  value: "1 Januari 2025",
                  valueClass: "",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className={cn("text-xs font-medium truncate", item.valueClass)}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Kolom Kanan ── */}
        <div className="space-y-6">
          {/* Card: Informasi Pribadi */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                  <CardDescription>
                    Perbarui nama, email, dan informasi kontak Anda
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                    Batal
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={infoForm.handleSubmit(handleSaveInfo)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        className="pl-9"
                        disabled={!isEditing}
                        {...infoForm.register("name")}
                      />
                    </div>
                    {infoForm.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {infoForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        disabled={!isEditing}
                        {...infoForm.register("email")}
                      />
                    </div>
                    {infoForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {infoForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        className="pl-9"
                        disabled={!isEditing}
                        {...infoForm.register("phone")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="unit">Unit / Departemen</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="unit"
                        className="pl-9"
                        disabled={!isEditing}
                        {...infoForm.register("unit")}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSavingInfo} className="gap-1.5">
                      {isSavingInfo ? (
                        <>
                          <span className="animate-spin inline-block">⏳</span>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card: Keamanan Akun */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Keamanan Akun</CardTitle>
              <CardDescription>
                Ubah password untuk menjaga keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passForm.handleSubmit(handleSavePassword)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="oldPassword">Password Saat Ini</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="oldPassword"
                      type={showOldPass ? "text" : "password"}
                      placeholder="Masukkan password saat ini"
                      className="pl-9 pr-10"
                      {...passForm.register("oldPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showOldPass ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showOldPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passForm.formState.errors.oldPassword && (
                    <p className="text-xs text-destructive">
                      {passForm.formState.errors.oldPassword.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPass ? "text" : "password"}
                        placeholder="Min. 8 karakter"
                        className="pl-9 pr-10"
                        {...passForm.register("newPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showNewPass ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showNewPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfPass ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        className="pl-9 pr-10"
                        {...passForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfPass(!showConfPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfPass ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showConfPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Syarat password baru:
                  </p>
                  {[
                    "Minimal 8 karakter",
                    "Kombinasi huruf dan angka disarankan",
                    "Tidak boleh sama dengan password saat ini",
                  ].map((rule) => (
                    <div key={rule} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">{rule}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    disabled={isSavingPass}
                    variant="outline"
                    className="gap-1.5"
                  >
                    {isSavingPass ? (
                      <>
                        <span className="animate-spin inline-block">⏳</span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5" />
                        Ubah Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
