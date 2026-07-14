import { CostOptimizationEngineDashboard } from "@/components/cockpit/cost-optimization/CostOptimizationEngineDashboard";

/** SCR E3-COST · E3-08 — Cost Optimization Engine */
export default function CostOptimizationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-08 · COST OPTIMIZATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Cost Optimization Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise cost intelligence · efficiency optimization · waste elimination · sustainable savings
        </p>
      </header>
      <CostOptimizationEngineDashboard />
    </div>
  );
}
