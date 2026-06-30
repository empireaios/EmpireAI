import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import type { AdPlatform, GlobalAdvertisingIntelligence } from "../models/global-advertising-intelligence.js";
import { AD_PLATFORMS } from "../models/global-advertising-intelligence.js";

const PLATFORM_DEFAULTS: Record<AdPlatform, { roas: number; cac: number; roi: number; campaign: string }> = {
  Meta: { roas: 3.2, cac: 18, roi: 220, campaign: "Prospecting — broad interest" },
  Google: { roas: 4.1, cac: 22, roi: 310, campaign: "Search — high-intent keywords" },
  TikTok: { roas: 2.8, cac: 14, roi: 180, campaign: "Spark Ads — UGC creative" },
  Pinterest: { roas: 2.5, cac: 16, roi: 150, campaign: "Catalog — lifestyle pins" },
  Reddit: { roas: 2.1, cac: 12, roi: 110, campaign: "Community — niche subreddits" },
  Microsoft: { roas: 3.5, cac: 20, roi: 250, campaign: "Bing Shopping — remarketing" },
  "Amazon Ads": { roas: 4.8, cac: 25, roi: 380, campaign: "Sponsored Products — ASIN defense" },
};

/** REAL-038 — Global advertising intelligence (recommendations only, no live ads). */
export function buildGlobalAdvertisingIntelligence(
  workspaceId: string,
  companyId: string,
): GlobalAdvertisingIntelligence {
  seedRevenuePipeline(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const liveProducts = pipeline.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state));
  const commerceProgram = PROGRAM_CATALOG.find((p) => p.programId === "commerce-execution");
  const budgetBase = Math.max(500, liveProducts.length * 250);

  const recommendations = AD_PLATFORMS.map((platform, i) => {
    const defaults = PLATFORM_DEFAULTS[platform];
    const product = liveProducts[i % Math.max(liveProducts.length, 1)];
    return {
      platform,
      campaignType: defaults.campaign,
      budgetUsd: Math.round(budgetBase * (1 + i * 0.15)),
      country: "US",
      marketplace: product?.supplierPlatform ?? "amazon-us",
      creativeAngle: product?.title ? `Hero: ${product.title.slice(0, 40)}` : "Problem-solution UGC hook",
      expectedRoas: defaults.roas,
      expectedCacUsd: defaults.cac,
      expectedRoiPercent: defaults.roi,
      rationale: `${platform} recommended for US — ${commerceProgram?.nextCursorMission ?? "complete commerce execution first"}`,
    };
  });

  const totalRecommendedBudgetUsd = recommendations.reduce((s, r) => s + r.budgetUsd, 0);
  const avgExpectedRoas = Math.round((recommendations.reduce((s, r) => s + r.expectedRoas, 0) / recommendations.length) * 10) / 10;
  const topPlatform = [...recommendations].sort((a, b) => b.expectedRoas - a.expectedRoas)[0]!.platform;

  return {
    moduleId: "global-advertising-intelligence",
    missionId: "REAL-038",
    workspaceId,
    companyId,
    recommendOnly: true,
    platforms: [...AD_PLATFORMS],
    recommendations,
    summary: { totalRecommendedBudgetUsd, avgExpectedRoas, topPlatform },
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
