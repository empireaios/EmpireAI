import { OpportunityPrioritizationDashboard } from "@/components/cockpit/opportunity-prioritization/OpportunityPrioritizationDashboard";

/** SCR E1-OPPORTUNITIES · E1-12 — Opportunity Prioritization Engine */
export default function OpportunityPrioritizationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-12 · HIGHEST ROI FIRST</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Opportunity Prioritization</h1>
        <p className="text-sm text-[#8a847a]">
          Discover · evaluate · rank strategic opportunities · focus resources on highest-value ROI
        </p>
      </header>
      <OpportunityPrioritizationDashboard />
    </div>
  );
}
