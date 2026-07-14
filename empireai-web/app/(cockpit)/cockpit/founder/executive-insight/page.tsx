import { ExecutiveInsightEngineDashboard } from "@/components/cockpit/executive-insight-engine/ExecutiveInsightEngineDashboard";

/** SCR E4-INSIGHT · E4-10 — Executive Insight Engine */
export default function ExecutiveInsightPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-10 · EXECUTIVE INSIGHT ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Insight Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Actionable executive intelligence · prioritized insights · strategic findings · critical risks and opportunities
        </p>
      </header>
      <ExecutiveInsightEngineDashboard />
    </div>
  );
}
