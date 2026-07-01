"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  cockpitCommandNavigation,
  cockpitDepartmentNavigation,
  type CockpitNavItem,
} from "@/lib/cockpit/navigation";
import { COCKPIT_BASE } from "@/lib/cockpit/types";
import {
  canAccessCockpitNav,
  cockpitNavIcons,
  isCockpitNavActive,
} from "./cockpitNavUtils";

export function CockpitSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const commandItems = cockpitCommandNavigation.filter((item) =>
    canAccessCockpitNav(item.roles, user?.role),
  );
  const departmentItems = cockpitDepartmentNavigation.filter((item) =>
    canAccessCockpitNav(item.roles, user?.role),
  );

  const renderGroup = (label: string, items: readonly CockpitNavItem[]) => (
    <div className="mb-6">
      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isCockpitNavActive(pathname, item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 ${
                  active
                    ? "bg-gold/10 text-[#f0d78c] shadow-[inset_2px_0_0_#d4af37]"
                    : "text-[#8a847a] hover:bg-white/[0.04] hover:text-[#f0d78c]"
                }`}
                title={item.label}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs ${
                    active
                      ? "bg-gold/15 text-[#d4af37]"
                      : "bg-white/[0.03] text-[#6f6a60] group-hover:text-[#d4af37]"
                  }`}
                >
                  {cockpitNavIcons[item.icon]}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <aside
      className={`hidden h-full flex-col border-r border-gold/10 bg-[#050505]/95 backdrop-blur-xl transition-all duration-500 lg:flex ${
        collapsed ? "w-[72px]" : "w-64"
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
          onClick={() => setCollapsed((current) => !current)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/15 text-[#d4af37] transition-colors hover:bg-gold/10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {renderGroup("Command", commandItems)}
        {renderGroup("Departments", departmentItems)}
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
