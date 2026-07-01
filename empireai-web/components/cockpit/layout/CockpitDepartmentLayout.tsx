"use client";

import type { ReactNode } from "react";
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
  const department = getCockpitNavItemById(departmentNavId);
  const tabs = getCockpitNavTabs(departmentNavId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow="Department"
        title={department?.label ?? departmentNavId}
        dataMode={dataMode}
      />
      <p className="text-sm text-[#8a847a]">{description}</p>
      <CockpitDepartmentTabs tabs={tabs} />
      <div>{children}</div>
    </div>
  );
}
