import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildGlobalOrderIntelligence } from "../../global-order-intelligence/services/global-order-intelligence-service.js";
import { buildPostPurchaseIntelligence } from "../../post-purchase-intelligence/services/post-purchase-intelligence-service.js";
import type { PostLaunchCommander } from "../models/post-launch-commander.js";

type ItemStatus = PostLaunchCommander["items"][number]["status"];

const OBSERVATION_AREAS = [
  "sales",
  "profit",
  "refunds",
  "reviews",
  "supplier",
  "customer",
  "marketplace",
] as const;

const AREA_LABELS: Record<(typeof OBSERVATION_AREAS)[number], string> = {
  sales: "Sales velocity",
  profit: "Profit margin",
  refunds: "Refunds & disputes",
  reviews: "Reviews & ratings",
  supplier: "Supplier fulfillment",
  customer: "Customer satisfaction",
  marketplace: "Marketplace performance",
};

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 50) return "PENDING";
  return "BLOCKED";
}

/** REAL-078 — Post-launch commander (post-purchase + order intelligence). */
export function buildPostLaunchCommander(
  workspaceId: string,
  companyId: string,
): PostLaunchCommander {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const liveProducts = products.filter((p) => ["LIVE", "MONITORING", "SCALING"].includes(p.state));
  const postPurchase = buildPostPurchaseIntelligence(workspaceId, companyId);
  const orders = buildGlobalOrderIntelligence(workspaceId, companyId);

  const items: PostLaunchCommander["items"] = OBSERVATION_AREAS.map((area) => {
    switch (area) {
      case "sales": {
        const score = liveProducts.length > 0 ? 72 + liveProducts.length * 4 : 40;
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score: Math.min(95, score),
          status: itemStatus(score),
          recommendation: liveProducts.length > 0 ? "Maintain ad spend on top converter — scale 10% weekly if ACOS stable" : "No live SKUs — return to launch commander REAL-077",
          evidence: `${liveProducts.length} live products · ${orders.summary.totalOrders} orders · revenue USD ${orders.summary.totalRevenueUsd}`,
          why: "Sales velocity confirms product-market fit before expansion spend",
        };
      }
      case "profit": {
        const score = orders.summary.avgProfitUsd >= 5 ? 82 : orders.summary.avgProfitUsd >= 2 ? 62 : 45;
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: score >= 75 ? "Profit healthy — test price lift on hero SKU" : "Audit COGS and marketplace fees — REAL-075 price intelligence",
          evidence: `Total profit USD ${orders.summary.totalProfitUsd} · avg USD ${orders.summary.avgProfitUsd}`,
          why: "Post-launch profit drift erodes SUCCESS-001 faster than revenue growth helps",
        };
      }
      case "refunds": {
        const refundRec = postPurchase.recommendations.find((r) => r.category === "refund");
        const score = refundRec?.priority === "CRITICAL" ? 42 : 68;
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: refundRec?.recommendation ?? "Monitor refund rate weekly — cap at 5% of orders",
          evidence: refundRec?.expectedImpact ?? "Baseline refund monitoring active",
          why: "Refund spikes signal listing mismatch or supplier quality issues",
        };
      }
      case "reviews": {
        const reviewRec = postPurchase.recommendations.find((r) => r.category === "review");
        const score = postPurchase.summary.retentionScore >= 60 ? 78 : 55;
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: reviewRec?.recommendation ?? "Request verified purchase reviews 7 days post-delivery",
          evidence: `${reviewRec?.expectedImpact ?? "+12% conversion"} · retention score ${postPurchase.summary.retentionScore}`,
          why: "Reviews drive organic rank and reduce paid acquisition dependency",
        };
      }
      case "supplier": {
        const supplierHealth = liveProducts.reduce((s, p) => s + (p.health?.supplierHealth ?? 50), 0)
          / Math.max(liveProducts.length, 1);
        const score = Math.round(supplierHealth);
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: score >= 70 ? "Supplier SLA stable — negotiate volume discount" : "Audit supplier lead times — REAL-071 supplier market",
          evidence: `Avg supplier health ${score} · platforms ${[...new Set(liveProducts.map((p) => p.supplierPlatform).filter(Boolean))].join(", ") || "none"}`,
          why: "Supplier failures post-launch destroy review scores and account health",
        };
      }
      case "customer": {
        const retentionRec = postPurchase.recommendations.find((r) => r.category === "retention");
        const score = postPurchase.summary.retentionScore;
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: retentionRec?.recommendation ?? "Deploy repeat-purchase nurture at day 14 and 30",
          evidence: `${retentionRec?.expectedImpact ?? "+18% repeat rate"} · cross-sell ops ${postPurchase.summary.crossSellOpportunities}`,
          why: "Customer LTV determines whether acquisition spend is commercially viable",
        };
      }
      case "marketplace": {
        const mpHealth = liveProducts.reduce((s, p) => s + (p.health?.marketplaceHealth ?? 50), 0)
          / Math.max(liveProducts.length, 1);
        const score = Math.round(mpHealth);
        return {
          itemId: `postlaunch-${area}`,
          label: AREA_LABELS[area],
          score,
          status: itemStatus(score),
          recommendation: score >= 70 ? "Listing health good — expand to secondary marketplace REAL-072" : "Fix listing suppressions — REAL-073 difference engine",
          evidence: `Marketplace health ${score} · channels ${[...new Set(liveProducts.map((p) => p.marketplaceId ?? p.supplierPlatform).filter(Boolean))].join(", ") || "unassigned"}`,
          why: "Marketplace algorithm penalties compound — early correction preserves rank",
        };
      }
    }
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "post-launch-commander",
    missionId: "REAL-078",
    workspaceId,
    companyId,
    summary: `${liveProducts.length} live products under observation · ${readyCount}/${items.length} areas healthy · ${orders.summary.totalOrders} orders tracked`,
    items,
    reusedModules: ["post-purchase-intelligence", "global-order-intelligence", "grand-king-revenue-pipeline"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
