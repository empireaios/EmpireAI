/** X2-09 — Enterprise Analytics Engine. */

import type { BusinessHealthRecord } from "./types.js";

export class EnterpriseAnalyticsEngine {
  summarize(records: BusinessHealthRecord[]): {
    decliningCount: number;
    highPerformingCount: number;
    averageComposite: number;
    topCompany: string | null;
    bottomCompany: string | null;
  } {
    if (records.length === 0) {
      return {
        decliningCount: 0,
        highPerformingCount: 0,
        averageComposite: 0,
        topCompany: null,
        bottomCompany: null,
      };
    }
    const decliningCount = records.filter((r) => r.decliningDetected).length;
    const highPerformingCount = records.filter((r) => r.highPerformingDetected).length;
    const averageComposite = Math.round(
      records.reduce((s, r) => s + r.compositeHealthScore, 0) / records.length,
    );
    const byRank = [...records].sort(
      (a, b) => a.overallEnterpriseRanking - b.overallEnterpriseRanking,
    );
    return {
      decliningCount,
      highPerformingCount,
      averageComposite,
      topCompany: byRank[0]?.companyReference ?? null,
      bottomCompany: byRank[byRank.length - 1]?.companyReference ?? null,
    };
  }
}
