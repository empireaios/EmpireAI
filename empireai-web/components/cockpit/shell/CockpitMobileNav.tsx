"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  COCKPIT_UX_MOBILE_PRIMARY,
  COCKPIT_UX_NAVIGATION,
} from "@/lib/cockpit-ux/navigation";
import { isCockpitNavActive } from "./cockpitNavUtils";

export function CockpitMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mobileTabs = COCKPIT_UX_NAVIGATION.filter((item) =>
    COCKPIT_UX_MOBILE_PRIMARY.includes(item.id),
  );
  const moreItems = COCKPIT_UX_NAVIGATION.filter(
    (item) => !COCKPIT_UX_MOBILE_PRIMARY.includes(item.id),
  );

  return (
    <>
      <nav
        aria-label="Cockpit mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-gold/10 bg-[#030303]/95 backdrop-blur-xl lg:hidden"
      >
        {mobileTabs.map((tab) => {
          const active = isCockpitNavActive(pathname, tab.href);
          const shortLabel =
            tab.id === "executive_home"
              ? "Home"
              : tab.id === "pillow"
                ? "Pillow"
                : tab.id === "mission_centre"
                  ? "Missions"
                  : tab.id === "builder"
                    ? "Builder"
                    : tab.label.split(" ")[0];
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider ${
                active ? "text-[#d4af37]" : "text-[#6f6a60]"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {shortLabel}
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Open all centres"
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
              Executive Cockpit · P7-02
            </p>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-lg border border-gold/10 px-3 py-3 text-sm text-[#c8c0b0] transition-colors hover:border-gold/25 hover:text-[#f0d78c]"
                >
                  <span className="mr-2">{item.icon}</span>
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
