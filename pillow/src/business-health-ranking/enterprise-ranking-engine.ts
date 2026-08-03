/** X2-09 — Enterprise Ranking Engine (objective ranking only). */

import type { BusinessHealthRecord } from "./types.js";

function rankBy(
  records: BusinessHealthRecord[],
  scoreOf: (r: BusinessHealthRecord) => number,
  descending: boolean,
): Map<string, number> {
  const sorted = [...records].sort((a, b) => {
    const diff = scoreOf(a) - scoreOf(b);
    return descending ? -diff : diff;
  });
  const map = new Map<string, number>();
  sorted.forEach((r, i) => map.set(r.companyReference, i + 1));
  return map;
}

export class EnterpriseRankingEngine {
  /** Assign objective rankings. Never manipulates scores — sorts only. */
  rank(records: BusinessHealthRecord[]): BusinessHealthRecord[] {
    if (records.length === 0) return [];

    const overall = rankBy(records, (r) => r.compositeHealthScore, true);
    const byFinancial = rankBy(records, (r) => r.financialHealthScore, true);
    const byOperational = rankBy(records, (r) => r.operationalHealthScore, true);
    const byGrowth = rankBy(records, (r) => r.growthHealthScore, true);
    const byCustomer = rankBy(records, (r) => r.customerHealthScore, true);
    const byRisk = rankBy(records, (r) => r.operationalRiskScore, false);

    return records.map((r) => ({
      ...r,
      overallEnterpriseRanking: overall.get(r.companyReference) ?? 0,
      rankingByFinancial: byFinancial.get(r.companyReference) ?? 0,
      rankingByOperational: byOperational.get(r.companyReference) ?? 0,
      rankingByGrowth: byGrowth.get(r.companyReference) ?? 0,
      rankingByCustomer: byCustomer.get(r.companyReference) ?? 0,
      rankingByOperationalRisk: byRisk.get(r.companyReference) ?? 0,
      rankingManipulated: false as const,
    }));
  }
}
