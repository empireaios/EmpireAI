import { MarketIntelligenceEngineDashboard } from "@/components/cockpit/market-intelligence-engine/MarketIntelligenceEngineDashboard";

/** SCR E4-MARKETS · E4-01 — Market Intelligence Engine */
export default function MarketIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-01 · MARKET INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Market Intelligence Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous global market awareness · opportunity detection · evidence-based executive intelligence
        </p>
      </header>
      <MarketIntelligenceEngineDashboard />
    </div>
  );
}
