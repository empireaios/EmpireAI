import { ExecutiveKpiEngineDashboard } from "@/components/cockpit/executive-kpi/ExecutiveKpiEngineDashboard";

/** SCR E3-KPI · E3-10 — Executive KPI Engine */
export default function ExecutiveKpiPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-10 · EXECUTIVE KPI</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive KPI Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise KPI measurement · performance trends · variance analysis · executive scorecard
        </p>
      </header>
      <ExecutiveKpiEngineDashboard />
    </div>
  );
}
