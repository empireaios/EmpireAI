import { DecisionAuditEngineDashboard } from "@/components/cockpit/decision-audit/DecisionAuditEngineDashboard";

/** SCR E2-AUDIT · E2-13 — Decision Audit Engine */
export default function DecisionAuditPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-13 · DECISION AUDIT</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Decision Audit Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Complete traceability · evidence preservation · executive accountability
        </p>
      </header>
      <DecisionAuditEngineDashboard />
    </div>
  );
}
