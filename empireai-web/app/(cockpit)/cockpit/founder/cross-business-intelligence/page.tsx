import { CrossBusinessIntelligenceDashboard } from "@/components/cockpit/cross-business-intelligence/CrossBusinessIntelligenceDashboard";

/** SCR E4-CROSS-BUSINESS · E4-13 — Cross-Business Intelligence */
export default function CrossBusinessIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-13 · CROSS-BUSINESS INTELLIGENCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Cross-Business Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise-wide intelligence correlation · knowledge sharing · synergies · cross-business opportunities and risks
        </p>
      </header>
      <CrossBusinessIntelligenceDashboard />
    </div>
  );
}
