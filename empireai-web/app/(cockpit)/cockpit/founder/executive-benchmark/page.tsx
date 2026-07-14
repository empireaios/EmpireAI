import { ExecutiveBenchmarkEngineDashboard } from "@/components/cockpit/executive-benchmark-engine/ExecutiveBenchmarkEngineDashboard";

/** SCR E4-BENCHMARK · E4-12 — Executive Benchmark Engine */
export default function ExecutiveBenchmarkPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-12 · EXECUTIVE BENCHMARK ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Benchmark Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Objective performance measurement · industry ranking · performance gaps · world-class standards comparison
        </p>
      </header>
      <ExecutiveBenchmarkEngineDashboard />
    </div>
  );
}
