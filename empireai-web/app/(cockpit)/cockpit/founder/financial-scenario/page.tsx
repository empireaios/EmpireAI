import { FinancialScenarioEngineDashboard } from "@/components/cockpit/financial-scenario/FinancialScenarioEngineDashboard";

/** SCR E3-SCENARIO · E3-09 — Financial Scenario Engine */
export default function FinancialScenarioPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-09 · FINANCIAL SCENARIO</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Financial Scenario Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise financial simulation · multiple futures · forecasting · decision support
        </p>
      </header>
      <FinancialScenarioEngineDashboard />
    </div>
  );
}
