import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { evaluateShippingAcceptability } from "../../../supplier-intelligence/services/shipping-acceptability-service.js";
import type { ShippingIntelligence } from "../models/shipping-intelligence.js";

type ItemStatus = ShippingIntelligence["items"][number]["status"];

const ROUTE_PROFILES = [
  { routeId: "us-domestic", destination: "US", warehouse: "US-East CJ hub", processingDays: 1, shipMin: 5, shipMax: 10, tolerance: 12 },
  { routeId: "uk-crossborder", destination: "GB", warehouse: "CN consolidation", processingDays: 2, shipMin: 10, shipMax: 18, tolerance: 16 },
  { routeId: "de-eu", destination: "DE", warehouse: "EU fulfillment partner", processingDays: 2, shipMin: 7, shipMax: 14, tolerance: 14 },
  { routeId: "au-remote", destination: "AU", warehouse: "CN direct", processingDays: 3, shipMin: 14, shipMax: 22, tolerance: 18 },
];

function itemStatus(score: number, acceptable: boolean): ItemStatus {
  if (!acceptable && score < 45) return "BLOCKED";
  if (score >= 70) return "READY";
  return "PENDING";
}

/** REAL-076 — Commercial shipping evaluation (never reject solely for slow shipping). */
export function buildShippingIntelligence(
  workspaceId: string,
  companyId: string,
): ShippingIntelligence {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const candidates = products.filter((p) => !["ARCHIVED", "FAILED", "REJECTED"].includes(p.state));
  const focus = candidates.find((p) => p.state === "LIVE") ?? candidates[0];

  const items: ShippingIntelligence["items"] = ROUTE_PROFILES.map((route) => {
    const evaluation = evaluateShippingAcceptability({
      targetCountry: route.destination,
      category: focus?.category ?? "kitchen",
      shippingDaysMin: route.shipMin,
      shippingDaysMax: route.shipMax,
      pricePoint: focus?.commercialScore ? 15 + focus.commercialScore * 0.25 : 22,
      suggestedRetailPrice: focus?.commercialScore ? 28 + focus.commercialScore * 0.35 : 34.99,
      marketplaceNormDays: route.tolerance,
      competitorExpectationDays: Math.max(7, route.tolerance - 2),
    });

    const totalDays = route.processingDays + Math.round((route.shipMin + route.shipMax) / 2);
    const costEstimate = route.destination === "US" ? 4.5 : route.destination === "AU" ? 9.2 : 6.8;
    const slowButCommercial = evaluation.verdict === "REVIEW_REQUIRED" && evaluation.acceptable;

    return {
      itemId: `shipping-${route.routeId}`,
      label: `${route.destination} — ${focus?.title ?? "Portfolio SKU"}`,
      score: evaluation.acceptabilityScore,
      status: itemStatus(evaluation.acceptabilityScore, evaluation.acceptable),
      recommendation: slowButCommercial
        ? `Commercial proceed with guardrails — ${totalDays}d total · disclose delivery window upfront`
        : evaluation.verdict === "EXCELLENT" || evaluation.verdict === "ACCEPTABLE"
          ? `Ship via ${route.warehouse} — ${totalDays}d meets customer tolerance (${route.tolerance}d)`
          : "Improve margin or premium positioning before scaling this lane — not auto-rejected for speed alone",
      evidence: [
        `processing ${route.processingDays}d`,
        `transit ${route.shipMin}-${route.shipMax}d`,
        `cost ~$${costEstimate}`,
        `warehouse ${route.warehouse}`,
        `destination ${route.destination}`,
        `tolerance ${route.tolerance}d`,
        `verdict ${evaluation.verdict}`,
        `time-alone-reject ${evaluation.shippingTimeAloneWouldReject}`,
      ].join(" · "),
      why: evaluation.shippingTimeAloneWouldReject
        ? "SUP-005 doctrine — slow shipping triggers review, not automatic rejection; margin and price tolerance decide commercial viability"
        : "Fast reliable shipping reduces refunds and improves review scores on marketplace algorithms",
    };
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "shipping-intelligence",
    missionId: "REAL-076",
    workspaceId,
    companyId,
    summary: `${items.length} shipping lanes evaluated · ${readyCount} commercially ready · slow-ship review never sole reject`,
    items,
    reusedModules: ["supplier-intelligence", "grand-king-revenue-pipeline"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
