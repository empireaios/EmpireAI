/** R5-16 — Trend Prediction Engine. */

import type { TrendRecord } from "./types.js";

export class TrendPredictionEngine {
  predict(record: TrendRecord): TrendRecord {
    const momentum = record.accelerationDetected
      ? 8
      : record.declineDetected
        ? -6
        : record.growthRate * 0.35;
    const predictedScore = Math.max(
      0,
      Math.min(100, Math.round((record.trendScore + momentum) * 100) / 100),
    );
    return {
      ...record,
      predictedScore,
      timestamp: new Date().toISOString(),
    };
  }

  predictSet(records: TrendRecord[]): TrendRecord[] {
    return records.map((record) => this.predict(record));
  }
}
