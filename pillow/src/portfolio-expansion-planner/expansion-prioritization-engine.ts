/** X2-18 — Expansion Prioritization Engine. */

import type { ExpansionPriority, ExpansionRecord } from "./types.js";

export class ExpansionPrioritizationEngine {
  rank(records: ExpansionRecord[]): ExpansionRecord[] {
    const weight: Record<ExpansionPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...records]
      .sort((a, b) => {
        const returnRatioA =
          a.estimatedInvestment > 0 ? a.expectedReturn / a.estimatedInvestment : 0;
        const returnRatioB =
          b.estimatedInvestment > 0 ? b.expectedReturn / b.estimatedInvestment : 0;
        const pw = weight[b.expansionPriority] - weight[a.expansionPriority];
        if (pw !== 0) return pw;
        if (returnRatioB !== returnRatioA) return returnRatioB - returnRatioA;
        return b.expectedReturn - a.expectedReturn;
      })
      .map((record, index) => ({
        ...record,
        rankedPosition: index + 1,
        timestamp: new Date().toISOString(),
      }));
  }
}
