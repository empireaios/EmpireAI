/** R2-19 — Cost Optimization Engine. */

import type { LogisticsRecord } from "../logistics-optimization/types.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";

export class CostOptimizationEngine {
  estimateProcurementCost(
    unitCost: number,
    quantity: number,
    logistics: LogisticsRecord | null,
    config: ProcurementIntelligenceConfiguration,
  ): { estimatedCost: number; savings: number; optimized: boolean } {
    const baseCost = unitCost * quantity;
    let logisticsCost = logistics?.estimatedShippingCost ?? 0;
    if (!config.costOptimizationRulesEnabled) {
      return { estimatedCost: Math.round((baseCost + logisticsCost) * 100) / 100, savings: 0, optimized: false };
    }
    if (logistics && logistics.optimizationScore >= 70) {
      logisticsCost *= 0.9;
    }
    const estimatedCost = Math.round((baseCost + logisticsCost) * 100) / 100;
    const baseline = baseCost + (logistics?.estimatedShippingCost ?? 0);
    const savings = Math.max(0, Math.round((baseline - estimatedCost) * 100) / 100);
    return {
      estimatedCost,
      savings,
      optimized: savings >= config.costOptimizationThreshold * 0.1,
    };
  }

  calculateConfidenceScore(input: {
    supplierScore: number;
    priceTrendStable: boolean;
    riskScore: number;
    hasProcurementHistory: boolean;
    config: ProcurementIntelligenceConfiguration;
  }): number {
    let score = input.supplierScore * 0.5;
    if (input.priceTrendStable) score += 15;
    score += Math.max(0, (100 - input.riskScore) * 0.2);
    if (input.hasProcurementHistory) score += 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
