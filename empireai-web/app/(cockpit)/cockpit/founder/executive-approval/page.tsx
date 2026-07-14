import { ExecutiveApprovalIntelligenceDashboard } from "@/components/cockpit/executive-approval/ExecutiveApprovalIntelligenceDashboard";

/** SCR E2-APPROVAL · E2-07 — Executive Approval Intelligence */
export default function ExecutiveApprovalPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-07 · APPROVAL INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Approval Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Intelligent authority · explainable governance · least necessary escalation · no unauthorized decisions
        </p>
      </header>
      <ExecutiveApprovalIntelligenceDashboard />
    </div>
  );
}
