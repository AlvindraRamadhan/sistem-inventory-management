"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Package, ShieldCheck, BarChart3, FileCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, ROLE_REDIRECTS } from "@/store/auth-store";
import { useRedirectIfAuthenticated } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: "Admin",    email: "admin@klinik.com",    password: "admin123" },
  { label: "Apoteker", email: "apoteker@klinik.com", password: "apoteker123" },
] as const;

const BULLETS = [
  { icon: ShieldCheck, text: "FEFO Engine otomatis" },
  { icon: BarChart3,   text: "Analisis Pareto & ABC" },
  { icon: FileCheck,   text: "Audit trail immutable" },
] as const;

export default function LoginPage() {
  useRedirectIfAuthenticated();

  const router = useRouter();
  const login  = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [loginError,   setLoginError]   = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function fillDemo(email: string, password: string) {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
    setLoginError(null);
  }

  async function onSubmit(values: LoginFormValues) {
    setLoginError(null);
    const result = await login(values.email, values.password);
    if (!result.success) {
      setLoginError(result.error ?? "Email atau password tidak valid.");
      return;
    }
    const user = useAuthStore.getState().user!;
    toast.success(`Selamat datang, ${user.name}!`);
    router.push(ROLE_REDIRECTS[user.role]);
  }

  return (
    <div className="w-full max-w-[1160px] min-h-[620px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex">

      {/* ── Left: Branding Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[500px] flex-shrink-0 flex-col justify-between bg-white border-r border-gray-100 p-12">

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200">
              <Package className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-none">Smart Clinic</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">SISTEM INVENTARIS</p>
            </div>
          </div>

          <h1 className="text-[30px] font-bold text-gray-900 leading-tight mb-4">
            Kelola inventaris<br />
            obat lebih cerdas<br />
            dan terstruktur.
          </h1>

          <p className="text-sm text-gray-500 leading-relaxed max-w-[340px]">
            Sistem manajemen inventaris farmasi berbasis FEFO,
            dengan tracking batch, analisis Pareto, dan audit
            trail lengkap untuk klinik modern.
          </p>

          <div className="mt-8 space-y-3">
            {BULLETS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                </div>
                <span className="text-sm text-gray-500">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-gray-400">v1.0 · Smart Clinic Inventory Management System</p>
      </div>

      {/* ── Right: Form Panel ────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col justify-center px-10 lg:px-14 py-10">
        <div className="w-full max-w-[420px] mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Smart Clinic</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">SISTEM INVENTARIS</p>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground mb-1">Masuk</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Gunakan akun yang diberikan oleh admin klinik.
          </p>

          {/* Demo accounts */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Akun Demo</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className="flex-1 text-sm py-2 px-3 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="nama@klinik.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {loginError && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg" role="alert">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-medium mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Masuk...</> : "Masuk"}
            </Button>

          </form>

        </div>
      </div>

    </div>
  );
}
