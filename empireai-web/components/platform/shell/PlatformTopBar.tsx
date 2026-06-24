"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useBrainEvents } from "@/lib/brain/hooks/useBrainEvents";
import { getModuleById, primaryNavModules } from "@/lib/platform/navigation";

export function PlatformTopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [liveEvents, setLiveEvents] = useState(0);

  useBrainEvents((event) => {
    if (event.type === "tool_executed" || event.type === "request") {
      setLiveEvents((count) => count + 1);
    }
  });

  const activeModule = primaryNavModules.find((m) =>
    pathname.startsWith(m.href),
  );
  const settingsActive = pathname.startsWith("/platform/settings");
  const adminActive = pathname.startsWith("/platform/admin");
  const current =
    activeModule ??
    (settingsActive
      ? getModuleById("settings")
      : adminActive
        ? getModuleById("admin")
        : getModuleById("dashboard"));

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "EA";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gold/10 bg-[#030303]/90 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <Link
            href="/platform/dashboard"
            className="font-display text-lg text-[#f0d78c]"
          >
            EmpireAI
          </Link>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#6f6a60]">
            AI Operating System
          </p>
          <p className="text-sm font-medium text-[#f0d78c]">
            {current?.label ?? "Platform"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Brain connected · {liveEvents} events</span>
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
            {user?.role ?? "Session"}
          </p>
          <p className="text-sm font-semibold text-[#d4af37]">{user?.name ?? "Guest"}</p>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="hidden rounded-lg border border-gold/15 px-3 py-1.5 text-xs text-[#d4af37] hover:bg-gold/10 sm:block"
        >
          Sign out
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gradient-to-br from-[#d4af37] to-[#9a7b1a] text-xs font-bold text-[#1a1408]">
          {initials}
        </div>
      </div>
    </header>
  );
}
