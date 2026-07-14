import { CapitalAllocationEngineDashboard } from "@/components/cockpit/capital-allocation/CapitalAllocationEngineDashboard";

/** SCR E3-CAPITAL · E3-02 — Capital Allocation Engine */
export default function CapitalAllocationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-02 · CAPITAL ALLOCATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Capital Allocation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Strategic capital deployment · ROI optimization · constitutional governance
        </p>
      </header>
      <CapitalAllocationEngineDashboard />
    </div>
  );
}
