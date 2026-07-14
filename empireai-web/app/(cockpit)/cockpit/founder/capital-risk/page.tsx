import { CapitalRiskEngineDashboard } from "@/components/cockpit/capital-risk/CapitalRiskEngineDashboard";

/** SCR E3-RISK · E3-11 — Capital Risk Engine */
export default function CapitalRiskPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-11 · CAPITAL RISK</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Capital Risk Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Capital risk management · exposure analysis · mitigation · capital preservation
        </p>
      </header>
      <CapitalRiskEngineDashboard />
    </div>
  );
}
