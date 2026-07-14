import { OpportunityDiscoveryEngineDashboard } from "@/components/cockpit/opportunity-discovery-engine/OpportunityDiscoveryEngineDashboard";

/** SCR E4-OPPORTUNITIES · E4-03 — Opportunity Discovery Engine */
export default function OpportunityDiscoveryPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-03 · OPPORTUNITY DISCOVERY</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Opportunity Discovery Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous opportunity discovery · evidence-based prioritization · growth intelligence
        </p>
      </header>
      <OpportunityDiscoveryEngineDashboard />
    </div>
  );
}
