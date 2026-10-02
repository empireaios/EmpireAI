"use client";

import Link from "next/link";
import layout from "./PillowDesktopLayout.module.css";
import { usePathname } from "next/navigation";
import { COCKPIT_BASE } from "@/lib/cockpit/types";
import { COCKPIT_UX_NAVIGATION } from "@/lib/cockpit-ux/navigation";
import { isCockpitNavActive } from "./cockpitNavUtils";

/**
 * Grand King active navigation — operational Centres only.
 * Legacy department IA destinations are not shown until each is proven real.
 */
export function CockpitSidebar({ collapsed, onToggle, inFlow = false }: {
  inFlow?: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  const primaryNav = COCKPIT_UX_NAVIGATION.filter((item) => item.group === "primary");
  const operationsNav = COCKPIT_UX_NAVIGATION.filter((item) => item.group === "operations");
  const systemNav = COCKPIT_UX_NAVIGATION.filter((item) => item.group === "system");

  const renderCockpitGroup = (
    label: string,
    items: typeof COCKPIT_UX_NAVIGATION,
  ) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isCockpitNavActive(pathname, item.href);
          const availability = item.availability ?? "live";
          const title =
            availability === "unavailable"
              ? item.unavailableReason ?? "Not yet available"
              : availability === "partial"
                ? `${item.description} (partial)`
                : item.description;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 ${
                  active
                    ? "bg-gold/10 text-[#f0d78c] shadow-[inset_2px_0_0_#d4af37]"
                    : availability === "unavailable"
                      ? "text-[#5a564e] hover:bg-white/[0.03] hover:text-[#8a847a]"
                      : "text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c]"
                }`}
                title={title}
                aria-disabled={availability === "unavailable" ? undefined : undefined}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs ${
                    active
                      ? "bg-gold/15 text-[#d4af37]"
                      : "bg-white/[0.03] text-[#6f6a60] group-hover:text-[#d4af37]"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {availability === "unavailable" && (
                      <span className="shrink-0 text-[9px] uppercase tracking-wider text-[#5a564e]">
                        Soon
                      </span>
                    )}
                    {availability === "partial" && (
                      <span className="shrink-0 text-[9px] uppercase tracking-wider text-[#6f6a60]">
                        Partial
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      aria-label="Cockpit navigation"
      data-sidebar-state={collapsed ? "collapsed" : "expanded"}
      style={inFlow ? { width: collapsed ? 72 : 256 } : undefined}
      className={`fixed inset-y-0 left-0 z-50 hidden h-dvh flex-col border-r border-gold/10 bg-[#050505] pointer-events-auto lg:flex ${
        inFlow ? layout.sidebar : collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gold/10 px-4 py-5">
        {!collapsed && (
          <Link
            href={COCKPIT_BASE}
            className="font-display bg-gradient-to-r from-[#f0d78c] to-[#d4af37] bg-clip-text text-lg tracking-[0.1em] text-transparent"
          >
            EmpireAI Cockpit
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/15 text-[#d4af37] transition-colors hover:bg-gold/10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {renderCockpitGroup("Executive Cockpit", primaryNav)}
        {renderCockpitGroup("Operations", operationsNav)}
        {renderCockpitGroup("System", systemNav)}
      </nav>

      <div className="border-t border-gold/10 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[#6f6a60] transition-colors hover:text-[#f0d78c]"
        >
          {!collapsed && "← Back to empireai.com"}
        </Link>
      </div>
    </aside>
  );
}
