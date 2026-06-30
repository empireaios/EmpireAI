import { randomUUID } from "node:crypto";

import { buildExecutiveProductOptimization } from "../../executive-product-optimization/services/executive-product-optimization-service.js";
import { buildGlobalOpportunityEngine } from "../../global-opportunity-engine/services/global-opportunity-engine-service.js";
import { buildSupplierIntelligenceLoop } from "../../supplier-intelligence-loop/services/supplier-intelligence-loop-service.js";
import type { RevenueImprovementProposal } from "../models/revenue-improvement-engine.js";
import type { RevenueImprovementEngine } from "../models/revenue-improvement-engine.js";

const ACTION_TO_TYPE: Record<string, RevenueImprovementProposal["improvementType"]> = {
  IMPROVE_TITLE: "IMPROVE_LISTING",
  CHANGE_PRICE: "INCREASE_PRICE",
  IMPROVE_MEDIA: "IMPROVE_MEDIA",
  EXPAND_COUNTRY: "EXPAND_COUNTRIES",
  EXPAND_MARKETPLACE: "EXPAND_MARKETPLACES",
  INCREASE_ADVERTISING: "UPSELL",
  ARCHIVE_PRODUCT: "ARCHIVE_PRODUCT",
  CHANGE_SUPPLIER: "REPLACE_SUPPLIER",
  EXPAND_CATEGORY: "CROSS_SELL",
};

/** REAL-017 — Aggregated revenue improvement proposals (recommendation only). */
export function buildRevenueImprovementEngine(
  workspaceId: string,
  companyId: string,
): RevenueImprovementEngine {
  const optimization = buildExecutiveProductOptimization(workspaceId, companyId);
  const opportunities = buildGlobalOpportunityEngine(workspaceId, companyId);
  const supplierLoop = buildSupplierIntelligenceLoop(workspaceId, companyId);

  const proposals: RevenueImprovementProposal[] = [];

  for (const rec of optimization.recommendations) {
    proposals.push({
      proposalId: randomUUID(),
      improvementType: ACTION_TO_TYPE[rec.action] ?? "IMPROVE_LISTING",
      title: rec.recommendation,
      productId: rec.productId,
      expectedRevenueGainUsd: Math.round(rec.expectedProfitIncreaseUsd * 2.5),
      expectedProfitGainUsd: rec.expectedProfitIncreaseUsd,
      confidence: rec.confidence,
      businessJustification: `${rec.businessImpact} — ${rec.evidence.join("; ")}`,
      sourceModule: "executive-product-optimization",
      autoExecuteBlocked: true,
    });
  }

  for (const opp of opportunities.opportunityQueue) {
    proposals.push({
      proposalId: randomUUID(),
      improvementType: "NEW_OPPORTUNITY",
      title: opp.title,
      expectedRevenueGainUsd: opp.expectedProfitUsd * 3,
      expectedProfitGainUsd: opp.expectedProfitUsd,
      confidence: opp.opportunityScore,
      businessJustification: opp.executiveRecommendation,
      sourceModule: "global-opportunity-engine",
      autoExecuteBlocked: true,
    });
  }

  for (const signal of supplierLoop.signals.filter((s) =>
    ["BETTER_SUPPLIER", "HIGHER_MARGIN_SUPPLIER", "FASTER_SUPPLIER"].includes(s.signalType),
  )) {
    proposals.push({
      proposalId: randomUUID(),
      improvementType: signal.signalType === "FASTER_SUPPLIER" ? "REPLACE_SUPPLIER" : "REPLACE_SUPPLIER",
      title: signal.recommendation,
      productId: signal.supplierProductId,
      expectedRevenueGainUsd: 400,
      expectedProfitGainUsd: 150,
      confidence: signal.confidence,
      businessJustification: `Supplier intelligence signal: ${signal.signalType}`,
      sourceModule: "supplier-intelligence-loop",
      autoExecuteBlocked: true,
    });
  }

  proposals.sort((a, b) => b.expectedProfitGainUsd - a.expectedProfitGainUsd);

  const totalExpectedProfitGainUsd = proposals.reduce((s, p) => s + p.expectedProfitGainUsd, 0);

  return {
    moduleId: "revenue-improvement-engine",
    missionId: "REAL-017",
    workspaceId,
    companyId,
    proposals: proposals.slice(0, 25),
    totalExpectedProfitGainUsd,
    computedAt: new Date().toISOString(),
  };
}
