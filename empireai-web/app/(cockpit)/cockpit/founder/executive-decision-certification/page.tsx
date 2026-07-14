import { ExecutiveDecisionCertificationPanel } from "@/components/cockpit/executive-decision-certification/ExecutiveDecisionCertificationPanel";

/** SCR E2-CERTIFIED · E2-16 — Executive Decision Engine Certification */
export default function ExecutiveDecisionCertificationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-16 · EXECUTIVE DECISION CERTIFIED</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Decision Engine Certification</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional certification of Phase E2 · enterprise-grade executive decision capabilities
        </p>
      </header>
      <ExecutiveDecisionCertificationPanel />
    </div>
  );
}
