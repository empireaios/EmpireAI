"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { cockpitNavigation } from "@/lib/cockpit/navigation";
import {
  canAccessCockpitNav,
  cockpitNavIcons,
  isCockpitNavActive,
} from "./cockpitNavUtils";

const mobilePrimaryIds = new Set(["home", "command", "missions"]);

export function CockpitMobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleNavigation = cockpitNavigation.filter((item) =>
    canAccessCockpitNav(item.roles, user?.role),
  );

  const mobileTabs = visibleNavigation.filter((item) => mobilePrimaryIds.has(item.id));
  const moreItems = visibleNavigation.filter((item) => !mobilePrimaryIds.has(item.id));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-gold/10 bg-[#030303]/95 backdrop-blur-xl lg:hidden">
        {mobileTabs.map((tab) => {
          const active = isCockpitNavActive(pathname, tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider ${
                active ? "text-[#d4af37]" : "text-[#6f6a60]"
              }`}
            >
              <span className="text-base">{cockpitNavIcons[tab.icon]}</span>
              {tab.id === "home" ? "Home" : tab.id === "command" ? "Command" : "Missions"}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider text-[#6f6a60]"
        >
          <span className="text-base">+</span>
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-gold/20 bg-[#0a0a0a] p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#d4af37]">
              All Departments
            </p>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-lg border border-gold/10 px-3 py-3 text-sm text-[#c8c0b0] transition-colors hover:border-gold/25 hover:text-[#f0d78c]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
