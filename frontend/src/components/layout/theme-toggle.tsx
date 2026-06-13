"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[72px] h-9 rounded-full bg-muted animate-pulse" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="flex items-center gap-1 bg-muted rounded-full p-1 border border-border"
      role="group"
      aria-label="Pilih tema tampilan"
    >
      <button
        onClick={() => setTheme("light")}
        aria-label="Mode Terang"
        aria-pressed={!isDark}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
          !isDark
            ? "bg-white shadow-sm text-amber-500"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        aria-label="Mode Gelap"
        aria-pressed={isDark}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
          isDark
            ? "bg-zinc-700 shadow-sm text-blue-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
