import { ResourceAllocationEngineDashboard } from "@/components/cockpit/resource-allocation/ResourceAllocationEngineDashboard";

/** SCR E2-RESOURCES · E2-05 — Resource Allocation Engine */
export default function ResourceAllocationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-05 · RESOURCE PLANNING</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Resource Allocation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Optimal allocation · strategic value · expected ROI · no hidden resource usage
        </p>
      </header>
      <ResourceAllocationEngineDashboard />
    </div>
  );
}
