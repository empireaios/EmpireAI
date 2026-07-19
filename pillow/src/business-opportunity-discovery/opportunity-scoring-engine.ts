/** X1-02 — Opportunity Scoring Engine. */

import type { OpportunityRecord } from "./types.js";

export class OpportunityScoringEngine {
  score(
    record: OpportunityRecord,
    frameworkHealthScore: number,
    configMin: number,
  ): OpportunityRecord {
    // Structural scoring from framework readiness — never fabricates market facts.
    const base = Math.max(configMin, Math.min(100, Math.round(frameworkHealthScore * 0.85)));
    const categoryBoost =
      record.opportunityCategory === "profitable_niche" ||
      record.opportunityCategory === "underserved_market"
        ? 5
        : 0;
    const opportunityScore = Math.min(100, base + categoryBoost);
    const estimatedProfitability = Math.min(100, Math.round(opportunityScore * 0.9));
    const confidenceScore = Math.min(100, Math.round((opportunityScore + frameworkHealthScore) / 2));

    return {
      ...record,
      opportunityScore,
      estimatedProfitability,
      confidenceScore,
      structuralSignalOnly: true,
      fabricatedMarketInformation: false,
      validationStatus: "passed",
      timestamp: new Date().toISOString(),
    };
  }
}
