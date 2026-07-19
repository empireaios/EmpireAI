/** R5-09 — ROI Calculation Engine. */

import type { AttributionModel, AttributionRecord, RoiSnapshot } from "./types.js";

export class RoiCalculationEngine {
  calculate(input: {
    spend: number;
    revenue: number;
    model: AttributionModel;
  }): RoiSnapshot {
    const spend = Math.max(0, input.spend);
    const revenue = Math.max(0, input.revenue);
    const roas = spend === 0 ? (revenue > 0 ? Number.POSITIVE_INFINITY : 0) : revenue / spend;
    const marketingRoiPercent =
      spend === 0 ? (revenue > 0 ? 100 : 0) : ((revenue - spend) / spend) * 100;

    return {
      spend,
      revenue,
      roas: Number.isFinite(roas) ? Math.round(roas * 100) / 100 : 999,
      marketingRoiPercent: Math.round(marketingRoiPercent * 100) / 100,
      model: input.model,
    };
  }

  estimateSpendFromAttributions(records: AttributionRecord[]): number {
    if (records.length === 0) return 0;
    const attributed = records.reduce((sum, r) => sum + r.attributionValue, 0);
    return Math.round(attributed * 0.35 * 100) / 100;
  }

  estimateRevenueFromAttributions(records: AttributionRecord[]): number {
    if (records.length === 0) return 0;
    const values = new Set(records.map((r) => r.conversionValue));
    return [...values].reduce((a, b) => a + b, 0);
  }
}
