import type { PipelineProduct, RevenueHealth } from "../models/revenue-pipeline-core.js";
import { buildCisMissionControlDashboard } from "../../runtime/commerce-intelligence-studio/services/cis-mission-control-service.js";
import { buildAmazonMissionControlDashboard } from "../../runtime/amazon-global-seller/services/amazon-mission-control-service.js";
import { buildRealityReadinessDashboard } from "../../orchestration/reality-integration/services/reality-readiness-dashboard-service.js";
import { buildOperationFirstDollarDashboard } from "../../operation-first-dollar/services/operation-first-dollar-service.js";

/** GKR-005 — Six-dimension product revenue health. */
export function computeProductHealth(
  product: PipelineProduct,
  workspaceId: string,
  companyId: string,
): RevenueHealth {
  let cisConfidence = 50;
  let amazonReadiness = 40;
  let realityReadiness = 30;
  let ofdProgress = 40;

  try {
    cisConfidence = buildCisMissionControlDashboard(workspaceId, companyId).commercialConfidence;
  } catch { /* optional */ }
  try {
    amazonReadiness = buildAmazonMissionControlDashboard(workspaceId, companyId).commercialReadinessPercent;
  } catch { /* optional */ }
  try {
    realityReadiness = buildRealityReadinessDashboard(workspaceId, companyId).realCommerceReadinessPercent;
  } catch { /* optional */ }
  try {
    const ofd = buildOperationFirstDollarDashboard(workspaceId, companyId);
    ofdProgress = Math.round((ofd.milestonesAchieved / Math.max(1, ofd.milestonesTotal)) * 100);
  } catch { /* optional */ }

  const commercialHealth = product.commercialScore ?? cisConfidence;
  const listingHealth = product.state === "LIVE" || product.state === "SCALING" ? Math.min(95, commercialHealth + 10) : Math.max(30, commercialHealth - 10);
  const supplierHealth = product.supplierPlatform ? (product.supplierPlatform === "cj-dropshipping" ? 75 : 65) : 40;
  const marketplaceHealth = product.state === "LIVE" || product.state === "READY_TO_PUBLISH" ? amazonReadiness : Math.round(amazonReadiness * 0.6);
  const customerHealth = product.state === "LIVE" ? Math.min(90, ofdProgress + 20) : 50;
  const profitabilityHealth = product.commercialScore ? Math.min(95, product.commercialScore + 5) : Math.round((commercialHealth + ofdProgress) / 2);

  const overallScore = Math.round(
    (commercialHealth + listingHealth + supplierHealth + marketplaceHealth + customerHealth + profitabilityHealth) / 6,
  );

  return {
    commercialHealth,
    listingHealth,
    supplierHealth,
    marketplaceHealth,
    customerHealth,
    profitabilityHealth,
    overallScore,
    computedAt: new Date().toISOString(),
  };
}

export function computeAggregateCommercialHealth(
  products: PipelineProduct[],
  workspaceId: string,
  companyId: string,
): RevenueHealth {
  if (products.length === 0) {
    return computeProductHealth(
      { productId: "aggregate", workspaceId, companyId, title: "Empire", state: "DISCOVERED", lifecycleStage: "—", kingApproved: false, timeline: [], createdAt: "", updatedAt: "" },
      workspaceId,
      companyId,
    );
  }
  const healths = products.map((p) => p.health ?? computeProductHealth(p, workspaceId, companyId));
  const avg = (key: keyof RevenueHealth) =>
    Math.round(healths.reduce((s, h) => s + (typeof h[key] === "number" ? (h[key] as number) : 0), 0) / healths.length);

  return {
    commercialHealth: avg("commercialHealth"),
    listingHealth: avg("listingHealth"),
    supplierHealth: avg("supplierHealth"),
    marketplaceHealth: avg("marketplaceHealth"),
    customerHealth: avg("customerHealth"),
    profitabilityHealth: avg("profitabilityHealth"),
    overallScore: avg("overallScore"),
    computedAt: new Date().toISOString(),
  };
}
