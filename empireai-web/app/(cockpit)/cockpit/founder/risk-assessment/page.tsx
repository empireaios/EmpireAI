import { RiskAssessmentEngineDashboard } from "@/components/cockpit/risk-assessment/RiskAssessmentEngineDashboard";

/** SCR E2-RISKS · E2-02 — Risk Assessment Engine */
export default function RiskAssessmentPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-02 · RISK INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Risk Assessment Engine</h1>
        <p className="text-sm text-[#8a847a]">
          One constitutional risk authority · measurable · explainable · no hidden risks · risk before execution
        </p>
      </header>
      <RiskAssessmentEngineDashboard />
    </div>
  );
}
