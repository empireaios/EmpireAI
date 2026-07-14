import { ProfitOptimizationEngineDashboard } from "@/components/cockpit/profit-optimization/ProfitOptimizationEngineDashboard";

/** SCR E3-PROFIT · E3-07 — Profit Optimization Engine */
export default function ProfitOptimizationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-07 · PROFIT OPTIMIZATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Profit Optimization Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise profitability · margin optimization · profit intelligence · sustainable growth
        </p>
      </header>
      <ProfitOptimizationEngineDashboard />
    </div>
  );
}
