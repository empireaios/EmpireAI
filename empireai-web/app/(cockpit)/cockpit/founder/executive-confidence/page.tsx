import { ExecutiveConfidenceEngineDashboard } from "@/components/cockpit/executive-confidence/ExecutiveConfidenceEngineDashboard";

/** SCR E2-CONFIDENCE · E2-14 — Executive Confidence Engine */
export default function ExecutiveConfidencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-14 · EXECUTIVE CONFIDENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Confidence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Evidence-based confidence · historical calibration · transparent executive certainty
        </p>
      </header>
      <ExecutiveConfidenceEngineDashboard />
    </div>
  );
}
