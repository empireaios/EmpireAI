import { RoiIntelligenceEngineDashboard } from "@/components/cockpit/roi-intelligence/RoiIntelligenceEngineDashboard";

/** SCR E3-ROI · E3-05 — ROI Intelligence Engine */
export default function RoiIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-05 · ROI INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">ROI Intelligence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise ROI measurement · value creation · financial performance · continuous optimization
        </p>
      </header>
      <RoiIntelligenceEngineDashboard />
    </div>
  );
}
