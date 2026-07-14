import { ExecutiveAccountabilityEngineDashboard } from "@/components/cockpit/executive-accountability-engine/ExecutiveAccountabilityEngineDashboard";

/** SCR E5-ACCOUNTABILITY · E5-06 — Executive Accountability Engine */
export default function ExecutiveAccountabilityPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-06 · EXECUTIVE ACCOUNTABILITY ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Accountability Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous ownership and accountability tracking — every executive action has one accountable owner
        </p>
      </header>
      <ExecutiveAccountabilityEngineDashboard />
    </div>
  );
}
