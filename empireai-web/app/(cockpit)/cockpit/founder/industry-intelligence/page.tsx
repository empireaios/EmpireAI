import { IndustryIntelligenceEngineDashboard } from "@/components/cockpit/industry-intelligence-engine/IndustryIntelligenceEngineDashboard";

/** SCR E4-INDUSTRIES · E4-05 — Industry Intelligence Engine */
export default function IndustryIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-05 · INDUSTRY INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Industry Intelligence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous industry monitoring · structural evolution · evidence-based executive intelligence
        </p>
      </header>
      <IndustryIntelligenceEngineDashboard />
    </div>
  );
}
