import { ExecutiveRecommendationEngineDashboard } from "@/components/cockpit/executive-recommendation/ExecutiveRecommendationEngineDashboard";

/** SCR E2-RECOMMENDATIONS · E2-04 — Executive Recommendation Engine */
export default function ExecutiveRecommendationsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-04 · EXECUTIVE ADVISORY</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Recommendation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Evidence-based · explainable · constitutionally governed · no hidden reasoning
        </p>
      </header>
      <ExecutiveRecommendationEngineDashboard />
    </div>
  );
}
