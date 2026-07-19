/** X1-03 — Competitive Validation Engine (structural signals). */

import type { MarketRisk, MarketValidationRecord } from "./types.js";

export class CompetitiveValidationEngine {
  validateCompetitiveLandscape(
    record: MarketValidationRecord,
    competitionScore: number,
  ): MarketValidationRecord {
    const risks: MarketRisk[] = [...record.identifiedRisks];
    if (competitionScore < 50 && !risks.includes("competitive_pressure")) {
      risks.push("competitive_pressure");
    }
    return {
      ...record,
      competitionScore,
      identifiedRisks: risks,
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      timestamp: new Date().toISOString(),
    };
  }
}
