"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { CockpitDepartmentTabs } from "@/components/cockpit/layout/CockpitDepartmentTabs";
import type { CockpitDataMode } from "@/lib/cockpit/kpis/registry";
import { getCockpitNavItemById, getCockpitNavTabs } from "@/lib/cockpit/navigation";

type CockpitDepartmentLayoutProps = {
  departmentNavId: string;
  description: string;
  dataMode: CockpitDataMode;
  children: ReactNode;
};

/** Standard department shell — header, data mode badge, and registry-driven tabs. */
export function CockpitDepartmentLayout({
  departmentNavId,
  description,
  dataMode,
  children,
}: CockpitDepartmentLayoutProps) {
  const pathname = usePathname();
  const pillowPage = pathname === "/cockpit/development/pillow";
  const department = getCockpitNavItemById(departmentNavId);
  const tabs = getCockpitNavTabs(departmentNavId);

  if (pathname === "/cockpit/commerce/transactions") return <>{children}</>;

  const header = <>
      <CockpitPageHeader eyebrow="Department" title={department?.label ?? departmentNavId} dataMode={dataMode}/>
      <p className="text-sm text-[#8a847a]">{description}</p>
      <CockpitDepartmentTabs tabs={tabs}/>
    </>;

  return (
    <div className={`mx-auto flex max-w-7xl flex-col gap-6 ${pillowPage ? "h-full min-h-0 w-full gap-0" : ""}`}>
      {pillowPage ? <details className="relative shrink-0 lg:hidden">
        <summary className="cursor-pointer py-2 text-xs">Development navigation</summary>
        <div className="absolute inset-x-0 top-full z-50 max-h-[50dvh] space-y-4 overflow-y-auto rounded-xl border border-gold/20 bg-[#09151c] p-4">{header}</div>
      </details> : <div className="space-y-6">{header}</div>}
      <div className={pillowPage ? "flex min-h-0 flex-1 flex-col" : undefined}>{children}</div>
    </div>
  );
}
