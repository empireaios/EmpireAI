"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CockpitNavTab } from "@/lib/cockpit/navigation";
import { isCockpitNavActive } from "@/components/cockpit/shell/cockpitNavUtils";

type CockpitDepartmentTabsProps = {
  tabs: readonly CockpitNavTab[];
};

/** Department secondary tab navigation — sourced from cockpitNavigation. */
export function CockpitDepartmentTabs({ tabs }: CockpitDepartmentTabsProps) {
  const pathname = usePathname();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Department tabs"
      className="flex gap-1 overflow-x-auto border-b border-gold/10 pb-px"
    >
      {tabs.map((tab) => {
        const active = isCockpitNavActive(pathname, tab.href);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active
                ? "border-[#d4af37] text-[#f0d78c]"
                : "border-transparent text-[#8a847a] hover:border-gold/20 hover:text-[#f0d78c]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
