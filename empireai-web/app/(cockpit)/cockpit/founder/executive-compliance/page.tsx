import { ExecutiveComplianceEngineDashboard } from "@/components/cockpit/executive-compliance-engine/ExecutiveComplianceEngineDashboard";

/** SCR E5-COMPLIANCE · E5-04 — Executive Compliance Engine */
export default function ExecutiveCompliancePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-04 · EXECUTIVE COMPLIANCE ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Compliance Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous automatic compliance validation — constitutional, governance and executive policy enforcement
        </p>
      </header>
      <ExecutiveComplianceEngineDashboard />
    </div>
  );
}
