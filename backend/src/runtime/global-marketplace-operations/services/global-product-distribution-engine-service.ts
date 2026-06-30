import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { SupplierProductInput } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { getMarketplacesByCountry } from "../../global-commerce/services/global-commerce-registry-service.js";
import { getCountry } from "../../global-commerce/services/global-commerce-registry-service.js";
import { listExpansionIntelligenceScores } from "../../global-commerce-intelligence/services/expansion-intelligence-score-service.js";
import { evaluateShippingAcceptability } from "../../../supplier-intelligence/services/shipping-acceptability-service.js";
import { getEmpireAccessRecord } from "../../../operational-access/services/empire-access-registry-service.js";
import { getEmpirePlatform } from "../../../operational-access/models/empire-platform-catalog.js";
import type { GlobalDistributionPlan, DistributionClassification } from "../models/global-distribution-plan.js";

const MARKETPLACE_FEES: Record<string, number> = {
  amazon: 15,
  ebay: 12,
  etsy: 10,
  shopee: 8,
  lazada: 8,
  "tiktok-shop": 8,
  walmart: 15,
  shopify: 3,
  woocommerce: 2,
  rakuten: 10,
  default: 12,
};

function feeForFamily(family: string): number {
  return MARKETPLACE_FEES[family] ?? MARKETPLACE_FEES.default ?? 12;
}

function classifyEntry(score: number, shippingOk: boolean, connected: boolean): DistributionClassification {
  if (!shippingOk) return "REJECT";
  if (!connected) return "WATCHLIST";
  if (score >= 80) return "HIGH_CONFIDENCE";
  if (score >= 60) return "EXPERIMENT";
  if (score >= 40) return "WATCHLIST";
  return "REJECT";
}

/** REAL-011 — Global product distribution plan (no live publish unless gates allow). */
export function buildGlobalDistributionPlan(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
  productId: string,
): GlobalDistributionPlan {
  const scores = listExpansionIntelligenceScores(workspaceId, companyId);
  const blockers: string[] = ["Live publish blocked — governance gates enforced"];
  let livePublishAllowed = false;

  const shipping = evaluateShippingAcceptability({
    targetCountry: "US",
    category: product.category,
    shippingDaysMin: product.shippingDays ?? 8,
    shippingDaysMax: (product.shippingDays ?? 8) + 6,
    pricePoint: product.costPrice,
    suggestedRetailPrice: product.suggestedRetailPrice,
    marginPercent: product.marginPercent,
  });

  const entries = scores.flatMap((countryScore, countryIdx) => {
    const country = getCountry(countryScore.countryCode);
    if (!country) return [];
    const marketplaces = getMarketplacesByCountry(countryScore.countryCode).slice(0, 4);

    return marketplaces.map((mp, mpIdx) => {
      const family = mp.realityProviderId?.split("-")[0] ?? mp.providerId.split("-")[0] ?? "default";
      const fee = feeForFamily(family);
      const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
      const expectedRevenue = retail * (1 + (countryIdx % 3));
      const expectedProfit = Math.round(expectedRevenue * ((100 - fee) / 100) - product.costPrice * 2);
      const platformId = mp.realityProviderId;
      const access = platformId && getEmpirePlatform(platformId)
        ? getEmpireAccessRecord(workspaceId, platformId)
        : null;
      const connected = access ? ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(access.accessState) : false;
      const shippingOk = shipping.verdict !== "REVIEW_REQUIRED" || shipping.acceptabilityScore >= 50;
      const entryScore = Math.round((countryScore.expansionScore + (shippingOk ? 15 : 0) + (connected ? 10 : 0)) / 1.2);
      const classification = classifyEntry(entryScore, shippingOk, connected);
      const priority = countryIdx * 10 + mpIdx + 1;

      return {
        countryCode: country.countryCode,
        countryName: country.displayName,
        marketplaceId: mp.providerId,
        marketplaceName: mp.displayName,
        supplierWarehouseId: "cj-dropshipping:global",
        shippingAcceptable: shippingOk,
        shippingScore: shipping.acceptabilityScore,
        marketplaceFeePercent: fee,
        expectedProfitUsd: expectedProfit,
        expectedRevenueUsd: expectedRevenue,
        listingLocalizationRequired: country.countryCode !== "US",
        requiredApprovals: connected
          ? ["Executive Council debate", "Soul synthesis", "Grand King approval"]
          : ["Operational access credentials", "Executive Council debate", "Grand King approval"],
        risk: connected ? "Moderate marketplace policy risk" : "Credentials not connected",
        priority,
        classification,
        executiveRecommendation: classification === "HIGH_CONFIDENCE"
          ? `Launch ${product.title} on ${mp.displayName} in ${country.displayName}`
          : classification === "EXPERIMENT"
            ? `Test launch on ${mp.displayName} — monitor 30 days`
            : classification === "WATCHLIST"
              ? `Watch ${mp.displayName} — connect credentials first`
              : `Do not launch on ${mp.displayName} until risks resolved`,
      };
    });
  }).sort((a, b) => a.priority - b.priority);

  const viable = entries.filter((e) => e.classification !== "REJECT");
  const highConf = entries.filter((e) => e.classification === "HIGH_CONFIDENCE");
  const countriesFirst = [...new Set(viable.slice(0, 5).map((e) => e.countryCode))];
  const marketplacesFirst = [...new Set(viable.slice(0, 5).map((e) => e.marketplaceId))];
  const totalExpectedProfit = viable.reduce((s, e) => s + e.expectedProfitUsd, 0);
  const totalExpectedRevenue = viable.reduce((s, e) => s + e.expectedRevenueUsd, 0);

  let classification: DistributionClassification = "WATCHLIST";
  if (highConf.length >= 3) classification = "HIGH_CONFIDENCE";
  else if (viable.length >= 5) classification = "EXPERIMENT";
  else if (viable.length === 0) classification = "REJECT";

  if (classification === "HIGH_CONFIDENCE" && highConf.every((e) => e.requiredApprovals.length <= 3)) {
    blockers.push("Grand King approval still required — DOCTRINE-006");
  }

  const plan: GlobalDistributionPlan = {
    planId: randomUUID(),
    workspaceId,
    companyId,
    productId,
    supplierProductId: product.supplierProductId,
    productTitle: product.title,
    launchGloballyRecommended: classification === "HIGH_CONFIDENCE" || classification === "EXPERIMENT",
    countriesFirst,
    marketplacesFirst,
    totalExpectedProfitUsd: totalExpectedProfit,
    totalExpectedRevenueUsd: totalExpectedRevenue,
    supplierRisk: shipping.verdict === "REVIEW_REQUIRED" ? "Shipping SLA may breach customer expectations" : "Supplier acceptable for test markets",
    customerRisk: retailMarginLow(product) ? "Refund risk if quality mismatch" : "Low — margin supports expectations",
    marketplaceRisk: "Policy compliance required per marketplace",
    classification,
    entries: entries.slice(0, 40),
    livePublishAllowed,
    blockers,
    computedAt: new Date().toISOString(),
  };

  persistPlan(plan);
  return plan;
}

function retailMarginLow(product: SupplierProductInput): boolean {
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2;
  return ((retail - product.costPrice) / retail) < 0.3;
}

function persistPlan(plan: GlobalDistributionPlan): void {
  getDatabase().prepare(
    `INSERT INTO global_distribution_plans (plan_id, workspace_id, product_id, record_json, updated_at)
     VALUES (@id, @ws, @pid, @json, @at)
     ON CONFLICT(plan_id) DO UPDATE SET record_json = @json, updated_at = @at`,
  ).run({ id: plan.planId, ws: plan.workspaceId, pid: plan.productId, json: JSON.stringify(plan), at: plan.computedAt });
}

export function resetGlobalDistributionPlans(): void {
  getDatabase().prepare(`DELETE FROM global_distribution_plans`).run();
}
