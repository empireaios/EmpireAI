import { randomUUID } from "node:crypto";

import { listExpansionIntelligenceScores } from "../../global-commerce-intelligence/services/expansion-intelligence-score-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import { findSupplierOpportunities } from "../../../supplier-intelligence/services/supplier-opportunity-service.js";
import type { GlobalOpportunityEngine } from "../models/global-opportunity-engine.js";

/** REAL-016 — Global expansion opportunity engine (executive recommendation only). */
export function buildGlobalOpportunityEngine(
  workspaceId: string,
  companyId: string,
): GlobalOpportunityEngine {
  const scores = listExpansionIntelligenceScores(workspaceId, companyId);
  const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
  const supplierOpps = findSupplierOpportunities(workspaceId);

  const queue: GlobalOpportunityEngine["opportunityQueue"] = [];

  for (const country of scores.slice(0, 5)) {
    queue.push({
      opportunityId: randomUUID(),
      opportunityType: "COUNTRY",
      title: `Expand to ${country.displayName}`,
      opportunityScore: country.expansionScore,
      expectedRoi: country.grade === "A" ? "VERY_HIGH" : "HIGH",
      expectedPaybackDays: 30 + Math.round((100 - country.expansionScore) * 0.5),
      priority: country.expansionScore >= 75 ? "HIGH" : "MEDIUM",
      executiveRecommendation: `GCI score ${country.expansionScore} — ${country.summary.slice(0, 80)}`,
      expectedProfitUsd: country.expansionScore * 50,
    });
  }

  for (const weak of gmo.topWeakCountries.slice(0, 3)) {
    queue.push({
      opportunityId: randomUUID(),
      opportunityType: "REVENUE_GAP",
      title: `Fix revenue gap: ${weak.countryName}`,
      opportunityScore: 55,
      expectedRoi: "MEDIUM",
      expectedPaybackDays: 45,
      priority: "MEDIUM",
      executiveRecommendation: weak.reason,
      expectedProfitUsd: 500,
    });
  }

  for (const opp of supplierOpps.slice(0, 5)) {
    const score = opp.score.overallScore;
    queue.push({
      opportunityId: randomUUID(),
      opportunityType: "SUPPLIER_CATALOG",
      title: opp.title,
      opportunityScore: score,
      expectedRoi: score >= 75 ? "HIGH" : "MEDIUM",
      expectedPaybackDays: 21,
      priority: score >= 70 ? "HIGH" : "MEDIUM",
      executiveRecommendation: `${opp.score.recommendation} — ${opp.pipelineStatus}${opp.marginPercent != null ? ` · margin ${opp.marginPercent}%` : ""}`,
      expectedProfitUsd: Math.round((opp.marginPercent ?? 30) * 10),
    });
  }

  queue.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    moduleId: "global-opportunity-engine",
    missionId: "REAL-016",
    workspaceId,
    companyId,
    opportunityQueue: queue.slice(0, 15),
    computedAt: new Date().toISOString(),
  };
}
