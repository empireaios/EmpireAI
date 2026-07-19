/** R4-13 — Customer Return Profile Engine. */

import type { ReturnIntelligenceRecord } from "./types.js";

export type CustomerReturnProfile = {
  customerId: string;
  returnCount: number;
  highRiskCount: number;
  repeatPatternDetected: boolean;
  abnormalBehaviorDetected: boolean;
};

export class CustomerReturnProfileEngine {
  buildProfile(
    records: ReturnIntelligenceRecord[],
    customerId: string,
    config: { maxReturnsPerCustomerPerMonth: number; highRiskThreshold: number },
  ): CustomerReturnProfile {
    const customerRecords = records.filter((r) => r.customerId === customerId);
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const returnsThisMonth = customerRecords.filter(
      (r) => new Date(r.timestamp).getTime() >= oneMonthAgo,
    ).length;

    const highRiskCount = customerRecords.filter(
      (r) => r.returnRiskScore >= config.highRiskThreshold,
    ).length;

    return {
      customerId,
      returnCount: customerRecords.length,
      highRiskCount,
      repeatPatternDetected: returnsThisMonth >= 2,
      abnormalBehaviorDetected: returnsThisMonth > config.maxReturnsPerCustomerPerMonth,
    };
  }
}
