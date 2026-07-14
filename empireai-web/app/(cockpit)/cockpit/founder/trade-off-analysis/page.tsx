import { TradeOffAnalysisEngineDashboard } from "@/components/cockpit/trade-off-analysis/TradeOffAnalysisEngineDashboard";

/** SCR E2-TRADEOFFS · E2-10 — Trade-off Analysis Engine */
export default function TradeOffAnalysisPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-10 · TRADE-OFF ANALYSIS</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Trade-off Analysis Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Competing alternatives · measurable trade-offs · explainable analysis · constitutional governance
        </p>
      </header>
      <TradeOffAnalysisEngineDashboard />
    </div>
  );
}
