"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { AgentActivityPlaceholder } from "@/components/cockpit/widgets/AgentActivityPlaceholder";
import { CommandSnapshotPlaceholder } from "@/components/cockpit/widgets/CommandSnapshotPlaceholder";
import { DepartmentHealthRowPlaceholder } from "@/components/cockpit/widgets/DepartmentHealthRowPlaceholder";
import { ExecutiveHomeGreeting } from "@/components/cockpit/widgets/ExecutiveHomeGreeting";
import { KpiStripPlaceholder } from "@/components/cockpit/widgets/KpiStripPlaceholder";
import { MissionQueuePreviewPlaceholder } from "@/components/cockpit/widgets/MissionQueuePreviewPlaceholder";
import { PortfolioPulsePlaceholder } from "@/components/cockpit/widgets/PortfolioPulsePlaceholder";

/** SCR-001 — Executive Home composition (REAL-079 wireframe zones). */
export function ExecutiveHomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow="Executive Command"
        title="Executive Home"
        dataMode={getCockpitScreenDataMode("SCR-001")}
      />
      <ExecutiveHomeGreeting />
      <KpiStripPlaceholder />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CommandSnapshotPlaceholder />
        <MissionQueuePreviewPlaceholder />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioPulsePlaceholder />
        <AgentActivityPlaceholder />
      </div>
      <DepartmentHealthRowPlaceholder />
    </div>
  );
}
