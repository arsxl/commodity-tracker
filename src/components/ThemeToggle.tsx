"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative flex items-center justify-center h-10 px-4 rounded-full bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors font-mono text-xs font-bold overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="flex items-center gap-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute">
        <span className="uppercase tracking-widest">Light Mode</span>
        <Sun className="h-4 w-4 text-amber-500" />
      </div>
      <div className="flex items-center gap-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute">
        <span className="uppercase tracking-widest">Dark Mode</span>
        <Moon className="h-4 w-4 text-blue-400" />
      </div>
      {/* Invisible spacer to maintain width */}
      <div className="flex items-center gap-2 opacity-0 pointer-events-none">
        <span className="uppercase tracking-widest">Light Mode</span>
        <Sun className="h-4 w-4" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
