/** R2-08 — Supplier Scoring Engine. */

import type { SupplierMetricsSnapshot } from "./types.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import { ReliabilityCalculator } from "./reliability-calculator.js";

export type ComponentScores = {
  qualityScore: number;
  pricingScore: number;
  inventoryReliabilityScore: number;
  fulfilmentReliabilityScore: number;
  responsivenessScore: number;
  overallSupplierScore: number;
};

export class SupplierScoringEngine {
  private readonly reliability = new ReliabilityCalculator();

  calculateQualityScore(metrics: SupplierMetricsSnapshot): number {
    if (metrics.productCount === 0) return 0;
    const activeRatio = metrics.activeProductCount / metrics.productCount;
    return Math.round(activeRatio * 100);
  }

  calculatePricingScore(metrics: SupplierMetricsSnapshot): number {
    let score = metrics.priceStabilityScore;
    score -= metrics.priceAnomalyCount * 10;
    return Math.max(0, Math.min(100, score));
  }

  calculateComponentScores(
    metrics: SupplierMetricsSnapshot,
    config: SupplierRankingEngineConfiguration,
  ): ComponentScores {
    const qualityScore = this.calculateQualityScore(metrics);
    const pricingScore = this.calculatePricingScore(metrics);
    const inventoryReliabilityScore = this.reliability.calculateInventoryReliability(metrics);
    const fulfilmentReliabilityScore = this.reliability.calculateFulfilmentReliability(metrics);
    const responsivenessScore = this.reliability.calculateResponsiveness(metrics);

    let overallSupplierScore: number;
    if (config.weightingRulesEnabled) {
      overallSupplierScore = Math.round(
        qualityScore * config.qualityWeight +
          pricingScore * config.pricingWeight +
          inventoryReliabilityScore * config.inventoryReliabilityWeight +
          fulfilmentReliabilityScore * config.fulfilmentReliabilityWeight +
          responsivenessScore * config.responsivenessWeight,
      );
    } else {
      overallSupplierScore = Math.round(
        (qualityScore +
          pricingScore +
          inventoryReliabilityScore +
          fulfilmentReliabilityScore +
          responsivenessScore) /
          5,
      );
    }

    return {
      qualityScore,
      pricingScore,
      inventoryReliabilityScore,
      fulfilmentReliabilityScore,
      responsivenessScore,
      overallSupplierScore,
    };
  }
}
