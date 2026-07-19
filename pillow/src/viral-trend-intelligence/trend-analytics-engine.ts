/** R5-16 — Trend Analytics Engine. */

import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type { TrendRecord } from "./types.js";

export class TrendAnalyticsEngine {
  calculateScore(input: {
    channelSignal: number;
    seoHint: number;
    audienceMomentum: number;
    competitorPressure: number;
  }): number {
    return (
      Math.round(
        Math.max(
          0,
          Math.min(
            100,
            input.channelSignal * 0.3 +
              input.seoHint * 0.2 +
              input.audienceMomentum * 0.25 +
              input.competitorPressure * 0.25,
          ),
        ) * 100,
      ) / 100
    );
  }

  estimateGrowthRate(score: number, priorScore = 50): number {
    return Math.round((score - priorScore) * 100) / 100;
  }

  detectAcceleration(
    records: TrendRecord[],
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRecord[] {
    return records
      .map((record) => ({
        ...record,
        accelerationDetected: record.growthRate >= config.accelerationThresholdPercent,
        declineDetected: false,
        timestamp: new Date().toISOString(),
      }))
      .filter((r) => r.accelerationDetected);
  }

  detectDecline(
    records: TrendRecord[],
    config: ViralTrendIntelligenceConfiguration,
  ): TrendRecord[] {
    return records
      .map((record) => ({
        ...record,
        declineDetected: record.growthRate <= config.declineThresholdPercent,
        accelerationDetected: false,
        timestamp: new Date().toISOString(),
      }))
      .filter((r) => r.declineDetected);
  }

  averageScore(records: TrendRecord[]): number {
    if (records.length === 0) return 0;
    return (
      Math.round(
        (records.reduce((sum, r) => sum + r.trendScore, 0) / records.length) * 100,
      ) / 100
    );
  }
}
