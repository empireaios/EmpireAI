"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  cockpitNavigation,
} from "@/lib/cockpit/navigation";
import { COCKPIT_BASE } from "@/lib/cockpit/types";
import { isCockpitNavActive } from "./cockpitNavUtils";

function resolveCockpitTitle(pathname: string) {
  const candidates = cockpitNavigation.flatMap((item) => {
    const tabs = "tabs" in item && item.tabs ? [...item.tabs] : [];
    return [item, ...tabs];
  });

  const match = candidates
    .filter((item) => isCockpitNavActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) {
    return match.label;
  }

  const department = cockpitNavigation.find(
    (item) =>
      "tabs" in item &&
      item.tabs &&
      (isCockpitNavActive(pathname, item.href) ||
        item.tabs.some((tab) => isCockpitNavActive(pathname, tab.href))),
  );

  return department?.label ?? "Project Cockpit";
}

export function CockpitTopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const title = useMemo(() => resolveCockpitTitle(pathname), [pathname]);

  const activeDepartment = cockpitNavigation.find(
    (item) =>
      "tabs" in item &&
      item.tabs &&
      item.tabs.length > 0 &&
      (isCockpitNavActive(pathname, item.href) ||
        item.tabs.some((tab) => isCockpitNavActive(pathname, tab.href))),
  );

  const departmentTabs =
    activeDepartment && "tabs" in activeDepartment
      ? activeDepartment.tabs
      : undefined;

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "EA";

  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-[#030303]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Link href={COCKPIT_BASE} className="font-display text-lg text-[#f0d78c]">
              Cockpit
            </Link>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#6f6a60]">
              Executive Operating System
            </p>
            <p className="text-sm font-medium text-[#f0d78c]">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
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
      </div>

      {departmentTabs && departmentTabs.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-t border-gold/5 px-4 py-2 lg:px-8">
          {departmentTabs.map((tab) => {
            const active = isCockpitNavActive(pathname, tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-gold/10 text-[#f0d78c]"
                    : "text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
