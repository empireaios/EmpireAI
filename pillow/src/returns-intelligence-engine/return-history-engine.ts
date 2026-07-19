/** R4-13 — Return History Engine. */

import type { ReturnIntelligenceRecord } from "./types.js";

export type ReturnHistorySummary = {
  totalReturns: number;
  returnsThisMonth: number;
  averageRiskScore: number;
  topReasons: ReturnIntelligenceRecord["returnReason"][];
};

export class ReturnHistoryEngine {
  summarize(
    records: ReturnIntelligenceRecord[],
    customerId: string,
  ): ReturnHistorySummary {
    const customerRecords = records.filter((r) => r.customerId === customerId);
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const returnsThisMonth = customerRecords.filter(
      (r) => new Date(r.timestamp).getTime() >= oneMonthAgo,
    ).length;

    const reasonCounts = new Map<ReturnIntelligenceRecord["returnReason"], number>();
    for (const record of customerRecords) {
      reasonCounts.set(record.returnReason, (reasonCounts.get(record.returnReason) ?? 0) + 1);
    }

    const topReasons = [...reasonCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    const averageRiskScore =
      customerRecords.length > 0
        ? Math.round(
            customerRecords.reduce((sum, r) => sum + r.returnRiskScore, 0) /
              customerRecords.length,
          )
        : 0;

    return {
      totalReturns: customerRecords.length,
      returnsThisMonth,
      averageRiskScore,
      topReasons,
    };
  }
}
