import { InnovationIntelligenceEngineDashboard } from "@/components/cockpit/innovation-intelligence-engine/InnovationIntelligenceEngineDashboard";

/** SCR E4-INNOVATION · E4-07 — Innovation Intelligence Engine */
export default function InnovationIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-07 · INNOVATION INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Innovation Intelligence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous innovation discovery · emerging technologies · disruptive capabilities · executive intelligence
        </p>
      </header>
      <InnovationIntelligenceEngineDashboard />
    </div>
  );
}
