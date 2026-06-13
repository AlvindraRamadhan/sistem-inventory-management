"use client";

import { useRouter } from "next/navigation";
import { LogOut, PanelLeft, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { AppBreadcrumb } from "@/components/layout/breadcrumb";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { UserRole } from "@/lib/constants/roles";
import { ROUTES } from "@/lib/constants/routes";
import { NotificationDropdown } from "@/components/features/notifications/notification-dropdown";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { toggle } = useSidebarStore();

  function handleLogout() {
    toast.success("Anda telah keluar dari sistem.");
    logout();
    router.push(ROUTES.LOGIN);
  }

  if (!user) return null;

  const profileRoute =
    user.role === "admin" ? "/admin/profil" : "/apoteker/profil"

  const settingsRoute =
    user.role === "admin" ? "/admin/pengaturan" : "/apoteker/pengaturan"

  return (
    <header className=" sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between bg-background/95 px-6 shadow-[0_3px_6px_rgba(0,0,0,0.12)] backdrop-blur supports-backdrop-filter:bg-background/60 ">
      {/* Left: sidebar toggle + breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={toggle}
          className="text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-10 w-10" />
        </Button>
        <AppBreadcrumb />
      </div>

      {/* Right: theme toggle + notification + user */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-12 items-center gap-3 px-4 rounded-2xl",
                "bg-transparent",
                "text-muted-foreground",
                "hover:bg-primary/5",
                "hover:text-foreground",
                "active:bg-primary/10",
                "transition-all duration-200"
              )}
            >
              <Avatar size="lg">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start sm:flex">
                <span className="max-w-[180px] truncate text-base font-medium text-foreground">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role as UserRole]}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col gap-0.5 px-1.5 py-1.5">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <Badge className="mt-1 w-fit text-[10px]">
                {ROLE_LABELS[user.role as UserRole]}
              </Badge>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(profileRoute)}>
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(settingsRoute)}>
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onSelect={(e) => e.preventDefault()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5 text-destructive" />
                    Keluar dari Sistem?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan keluar dari{" "}
                    <span className="font-medium text-foreground">
                      Smart Clinic Inventory
                    </span>
                    . Sesi Anda akan diakhiri dan Anda perlu masuk kembali untuk
                    mengakses sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={handleLogout}
                  >
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
