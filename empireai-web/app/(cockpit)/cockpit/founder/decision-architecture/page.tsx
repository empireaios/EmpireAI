import { ExecutiveDecisionArchitectureDashboard } from "@/components/cockpit/executive-decision/ExecutiveDecisionArchitectureDashboard";

/** SCR E2-DECISIONS · E2-01 — Executive Decision Architecture */
export default function DecisionArchitecturePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-01 · DECISION FRAMEWORK</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Decision Architecture</h1>
        <p className="text-sm text-[#8a847a]">
          One constitutional decision framework · evidence · explainability · accountability · no arbitrary decisions
        </p>
      </header>
      <ExecutiveDecisionArchitectureDashboard />
    </div>
  );
}
