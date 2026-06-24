"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { platformModules } from "@/lib/platform/navigation";

const mobileTabs = [
  { id: "dashboard", label: "Home", href: "/platform/dashboard" },
  { id: "ai-ceo", label: "CEO", href: "/platform/ai-ceo" },
  { id: "orders", label: "Orders", href: "/platform/orders" },
  { id: "finance", label: "Finance", href: "/platform/finance" },
] as const;

export function PlatformMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreModules = platformModules.filter(
    (m) => !mobileTabs.some((t) => t.href === m.href),
  );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-gold/10 bg-[#030303]/95 backdrop-blur-xl lg:hidden">
        {mobileTabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider ${
                active ? "text-[#d4af37]" : "text-[#6f6a60]"
              }`}
            >
              <span className="text-base">{tab.label[0]}</span>
              {tab.label}
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
              All Modules
            </p>
            <div className="grid grid-cols-2 gap-2">
              {moreModules.map((mod) => (
                <Link
                  key={mod.id}
                  href={mod.href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-lg border border-gold/10 px-3 py-3 text-sm text-[#c8c0b0] transition-colors hover:border-gold/25 hover:text-[#f0d78c]"
                >
                  {mod.shortLabel ?? mod.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
