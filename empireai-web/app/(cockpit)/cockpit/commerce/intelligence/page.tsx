import { CommercialIntelligenceDashboard } from "@/components/cockpit/intelligence/CommercialIntelligenceDashboard";

/** SCR P8-INTELLIGENCE · P8-05 — Permanent Commercial Intelligence Architecture */
export default function CommerceIntelligencePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Commerce · P8-05</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Commercial Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Automation executes · Intelligence decides · evidence-backed recommendations
        </p>
      </header>
      <CommercialIntelligenceDashboard />
    </div>
  );
}
