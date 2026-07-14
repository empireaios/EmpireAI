import { ExecutivePlanningDashboardPanel } from "@/components/cockpit/executive-planning-dashboard/ExecutivePlanningDashboardPanel";

/** SCR E1-PLANNING · E1-14 — Executive Planning Dashboard (unified command center) */
export default function ExecutivePlanningPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-14 · UNIFIED COMMAND CENTER</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Planning Dashboard</h1>
        <p className="text-sm text-[#8a847a]">
          One cockpit for Vision, Objectives, Roadmap, Priorities, Portfolio, Dependencies, Growth, Opportunities and Alignment
        </p>
      </header>
      <ExecutivePlanningDashboardPanel />
    </div>
  );
}
