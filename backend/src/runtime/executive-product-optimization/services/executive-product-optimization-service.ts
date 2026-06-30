import { randomUUID } from "node:crypto";

import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { buildLiveProductIntelligence } from "../../live-product-intelligence/services/live-product-intelligence-service.js";
import type { ExecutiveProductOptimization, OptimizationRecommendation } from "../models/executive-product-optimization.js";

/** REAL-014 — Executive Council debates product optimization (nothing executes automatically). */
export function buildExecutiveProductOptimization(
  workspaceId: string,
  companyId: string,
): ExecutiveProductOptimization {
  const live = buildLiveProductIntelligence(workspaceId, companyId);
  const recommendations: OptimizationRecommendation[] = [];

  for (const product of live.liveProducts.slice(0, 10)) {
    if (product.lifecycle === "WINNER" || product.lifecycle === "GROWING") {
      recommendations.push(rec({
        productId: product.productId,
        action: "EXPAND_COUNTRY",
        recommendation: `Expand ${product.title} to next GCI-ranked country`,
        evidence: [`Lifecycle: ${product.lifecycle}`, `Profit $${product.metrics.profitUsd}`],
        confidence: 72,
        businessImpact: "High — winner scaling toward USD 100K",
        expectedProfitIncreaseUsd: product.metrics.profitUsd * 2,
        risk: "Operational complexity",
        expectedTimeDays: 21,
      }));
      recommendations.push(rec({
        productId: product.productId,
        action: "INCREASE_ADVERTISING",
        recommendation: "Increase ad spend on proven converter",
        evidence: [`Conversion ${product.metrics.conversionPercent}%`],
        confidence: 68,
        businessImpact: "Moderate revenue acceleration",
        expectedProfitIncreaseUsd: product.metrics.profitUsd * 0.5,
        risk: "ROAS erosion if untested",
        expectedTimeDays: 7,
      }));
    }
    if (product.lifecycle === "WEAK" || product.lifecycle === "DECLINING") {
      recommendations.push(rec({
        productId: product.productId,
        action: "IMPROVE_TITLE",
        recommendation: "A/B test listing title via CIS winning listing refresh",
        evidence: [product.whySucceedingOrFailing],
        confidence: 65,
        businessImpact: "Conversion recovery",
        expectedProfitIncreaseUsd: 150,
        risk: "Low",
        expectedTimeDays: 3,
      }));
      recommendations.push(rec({
        productId: product.productId,
        action: "CHANGE_PRICE",
        recommendation: product.metrics.profitUsd < 50 ? "Review margin — consider price increase" : "Test promotional price",
        evidence: [`Profit $${product.metrics.profitUsd}`, `Margin pressure`],
        confidence: 60,
        businessImpact: "Margin optimization",
        expectedProfitIncreaseUsd: 80,
        risk: "Volume trade-off",
        expectedTimeDays: 5,
      }));
    }
    if (product.lifecycle === "DEAD") {
      recommendations.push(rec({
        productId: product.productId,
        action: "ARCHIVE_PRODUCT",
        recommendation: "Archive dead product — reallocate focus to winners",
        evidence: ["Zero revenue trajectory", "CONSTITUTION-020 — no abandoned products without review"],
        confidence: 85,
        businessImpact: "Focus recovery",
        expectedProfitIncreaseUsd: 0,
        risk: "Opportunity cost only",
        expectedTimeDays: 1,
      }));
    }
    if (product.metrics.supplierPerformance < 60) {
      recommendations.push(rec({
        productId: product.productId,
        action: "CHANGE_SUPPLIER",
        recommendation: "Evaluate supplier alternatives via Supplier Intelligence",
        evidence: [`Supplier performance ${product.metrics.supplierPerformance}%`],
        confidence: 70,
        businessImpact: "Fulfillment reliability",
        expectedProfitIncreaseUsd: 200,
        risk: "SKU migration effort",
        expectedTimeDays: 14,
      }));
    }
  }

  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: "Live product optimization — continuous commercial improvement",
    subjectType: "product",
    summary: `${recommendations.length} optimization recommendations for ${live.liveProducts.length} live products. Nothing executes without Grand King.`,
  });

  return {
    moduleId: "executive-product-optimization",
    missionId: "REAL-014",
    workspaceId,
    companyId,
    recommendations: recommendations.slice(0, 20),
    debateTopic: debate.topic,
    computedAt: new Date().toISOString(),
  };
}

function rec(
  partial: Omit<OptimizationRecommendation, "recommendationId" | "autoExecuteBlocked">,
): OptimizationRecommendation {
  return { recommendationId: randomUUID(), autoExecuteBlocked: true, ...partial };
}
