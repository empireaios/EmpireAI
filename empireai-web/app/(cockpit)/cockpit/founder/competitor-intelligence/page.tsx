import { CompetitorIntelligenceEngineDashboard } from "@/components/cockpit/competitor-intelligence-engine/CompetitorIntelligenceEngineDashboard";

/** SCR E4-COMPETITORS · E4-02 — Competitor Intelligence Engine */
export default function CompetitorIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-02 · COMPETITOR INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Competitor Intelligence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Complete competitive visibility · strength and weakness analysis · evidence-based positioning
        </p>
      </header>
      <CompetitorIntelligenceEngineDashboard />
    </div>
  );
}
