import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildGlobalCategoryExpansionEngine } from "../../global-category-expansion-engine/services/global-category-expansion-engine-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import { buildGlobalOpportunityEngine } from "../../global-opportunity-engine/services/global-opportunity-engine-service.js";
import type { AiChiefOfGrowthDashboard } from "../models/ai-chief-of-growth.js";

/** REAL-032 — AI Chief of Growth (recommend only). */
export function buildAiChiefOfGrowth(
  workspaceId: string,
  companyId: string,
): AiChiefOfGrowthDashboard {
  seedRevenuePipeline(workspaceId, companyId);
  const categories = buildGlobalCategoryExpansionEngine(workspaceId, companyId);
  let opportunities: ReturnType<typeof buildGlobalOpportunityEngine> | null = null;
  try {
    opportunities = buildGlobalOpportunityEngine(workspaceId, companyId);
  } catch { /* optional */ }

  let countryRollout: AiChiefOfGrowthDashboard["countryRollout"] = [];
  let marketplaceRollout: AiChiefOfGrowthDashboard["marketplaceRollout"] = [];
  try {
    const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
    countryRollout = gmo.revenueByCountry.slice(0, 6).map((c) => ({
      country: c.countryName,
      readiness: c.profitUsd > 0 ? "READY" : "CREDENTIALS_PENDING",
    }));
    marketplaceRollout = gmo.revenueByMarketplace.slice(0, 6).map((m) => ({
      marketplace: m.marketplaceName,
      status: m.revenueUsd > 0 ? "ACTIVE" : "NOT_CONNECTED",
    }));
  } catch { /* optional */ }

  const products = listPipelineProducts(workspaceId, companyId);
  const productRollout = products
    .filter((p) => ["READY_TO_PUBLISH", "LIVE", "SCALING"].includes(p.state))
    .slice(0, 8)
    .map((p) => ({
      productId: p.productId,
      title: p.title ?? p.productId,
      action: p.state === "LIVE" ? "Scale" : "Launch after psychology gate",
    }));

  const growthRecommendations = [
    { title: categories.executiveRecommendation, evidence: categories.recommendationEvidence, priority: "HIGH" },
    ...(opportunities?.opportunityQueue.slice(0, 3).map((o) => ({
      title: o.title,
      evidence: o.executiveRecommendation,
      priority: o.priority,
    })) ?? []),
  ];

  return {
    moduleId: "ai-chief-of-growth",
    missionId: "REAL-032",
    workspaceId,
    companyId,
    growthRecommendations,
    expansionTargets: categories.topOpportunities,
    scalingPlan: [
      "Win first category in US before multi-country rollout",
      "Replicate winning SKU creative across marketplaces",
      "Attach live supplier inventory before ad scale",
    ],
    countryRollout,
    marketplaceRollout,
    productRollout,
    recommendOnly: true,
    reusedModules: ["global-category-expansion-engine", "global-opportunity-engine", "global-marketplace-operations"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
