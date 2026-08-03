/** X2-17 — Lifecycle Analytics Engine. */

import type { LifecycleRecord, LifecycleStage } from "./types.js";

export class LifecycleAnalyticsEngine {
  summarize(records: LifecycleRecord[]): {
    byStage: Record<LifecycleStage, number>;
    averageMaturity: number;
    pendingTransitions: number;
    notes: string[];
  } {
    const byStage: Record<LifecycleStage, number> = {
      launch: 0,
      growth: 0,
      mature: 0,
      retirement: 0,
    };
    for (const record of records) {
      byStage[record.currentLifecycleStage] += 1;
    }
    const averageMaturity = records.length
      ? Math.round(records.reduce((s, r) => s + r.maturityScore, 0) / records.length)
      : 0;
    const pendingTransitions = records.filter(
      (r) =>
        r.lifecycleStatus === "transition_pending" ||
        r.lifecycleStatus === "transition_recommended",
    ).length;
    return {
      byStage,
      averageMaturity,
      pendingTransitions,
      notes: [
        `Companies tracked: ${records.length}`,
        `Pending transitions: ${pendingTransitions}`,
        `Average maturity: ${averageMaturity}`,
      ],
    };
  }
}
