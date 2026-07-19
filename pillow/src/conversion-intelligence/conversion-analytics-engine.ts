/** R5-14 — Conversion Analytics Engine. */

import type { ConversionRecord } from "./types.js";

export class ConversionAnalyticsEngine {
  calculateEfficiency(input: {
    conversionRate: number;
    dropOffRate: number;
    landingPageScore?: number;
    audienceQuality?: number;
    attributedConversions?: number;
  }): number {
    const conversionScore = Math.max(0, Math.min(100, input.conversionRate));
    const dropOffPenalty = Math.max(0, Math.min(40, input.dropOffRate * 0.4));
    const landingScore = (input.landingPageScore ?? 50) * 0.25;
    const audienceScore = (input.audienceQuality ?? 50) * 0.15;
    const attributionBoost =
      input.attributedConversions !== undefined
        ? Math.min(20, input.attributedConversions * 2)
        : 10;
    return Math.round(
      Math.max(
        0,
        Math.min(100, conversionScore * 0.45 + landingScore + audienceScore + attributionBoost - dropOffPenalty),
      ),
    );
  }

  averageConversionRate(records: ConversionRecord[]): number {
    if (records.length === 0) return 0;
    return (
      Math.round(
        (records.reduce((sum, r) => sum + r.conversionRate, 0) / records.length) * 100,
      ) / 100
    );
  }

  measureLandingPage(score: number, conversionRate: number): number {
    return Math.round(Math.max(0, Math.min(100, score * 0.7 + conversionRate * 0.3)) * 100) / 100;
  }
}
