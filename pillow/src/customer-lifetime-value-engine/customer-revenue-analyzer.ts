/** R4-15 — Customer Revenue Analyzer. */

import type { RevenueRecord } from "../revenue-engine/types.js";

export class CustomerRevenueAnalyzer {
  analyze(records: RevenueRecord[]): {
    revenueContribution: number;
    purchaseFrequency: number;
    averageOrderValue: number;
  } {
    if (records.length === 0) {
      return { revenueContribution: 0, purchaseFrequency: 0, averageOrderValue: 0 };
    }

    const revenueContribution = records.reduce((sum, r) => sum + r.netRevenue, 0);
    const purchaseFrequency = records.length;
    const averageOrderValue =
      Math.round((revenueContribution / purchaseFrequency) * 100) / 100;

    return { revenueContribution, purchaseFrequency, averageOrderValue };
  }
}
