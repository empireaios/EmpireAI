import { CrisisDecisionEngineDashboard } from "@/components/cockpit/crisis-decision/CrisisDecisionEngineDashboard";

/** SCR E2-CRISES · E2-08 — Crisis Decision Engine */
export default function CrisisDecisionsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-08 · CRISIS DECISIONS</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Crisis Decision Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Rapid response · constitutional integrity · business continuity · controlled recovery
        </p>
      </header>
      <CrisisDecisionEngineDashboard />
    </div>
  );
}
