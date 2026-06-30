import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import type { GlobalPriceIntelligence } from "../models/global-price-intelligence.js";

type ItemStatus = GlobalPriceIntelligence["items"][number]["status"];

const PRICING_DIMENSIONS = [
  "selling_price",
  "country_price",
  "marketplace_price",
  "margin",
  "promotion",
  "discount",
  "bundle",
  "psychological_pricing",
  "profit_impact",
] as const;

const PRICING_LABELS: Record<(typeof PRICING_DIMENSIONS)[number], string> = {
  selling_price: "Selling price",
  country_price: "Country price",
  marketplace_price: "Marketplace price",
  margin: "Margin",
  promotion: "Promotion",
  discount: "Discount",
  bundle: "Bundle",
  psychological_pricing: "Psychological pricing",
  profit_impact: "Profit impact",
};

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 50) return "PENDING";
  return "BLOCKED";
}

function psychologicalPrice(base: number): number {
  const rounded = Math.floor(base);
  return rounded - 0.01 + (rounded % 10 === 0 ? 0.99 : 0);
}

/** REAL-075 — Global price intelligence (empire-economics + pipeline products). */
export function buildGlobalPriceIntelligence(
  workspaceId: string,
  companyId: string,
): GlobalPriceIntelligence {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const commerceProgram = PROGRAM_CATALOG.find((p) => p.programId === "commerce-execution");
  const activeProducts = products.filter((p) => !["ARCHIVED", "FAILED", "REJECTED"].includes(p.state));
  const focus = activeProducts[0] ?? products[0];

  const baseCost = focus?.health?.profitabilityHealth ? 12 + (100 - focus.health.profitabilityHealth) * 0.15 : 18;
  const retail = focus?.commercialScore ? 20 + focus.commercialScore * 0.4 : 29.99;
  const marginPct = retail > 0 ? Math.round(((retail - baseCost) / retail) * 100) : economics.contributionMarginPercent;
  const countryMultiplier = 1.08;
  const marketplaceMultiplier = 1.12;

  const items: GlobalPriceIntelligence["items"] = PRICING_DIMENSIONS.map((dim) => {
    switch (dim) {
      case "selling_price": {
        const score = marginPct >= 35 ? 82 : marginPct >= 25 ? 68 : 48;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `Recommend $${retail.toFixed(2)} base retail · COGS ~$${baseCost.toFixed(2)}`,
          evidence: `Contribution margin ${economics.contributionMarginPercent}% · product margin ${marginPct}%`,
          why: "Selling price must clear marketplace fees and supplier COGS before ad spend",
        };
      }
      case "country_price": {
        const local = retail * countryMultiplier;
        const score = 70;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `UK/EU local price ~$${local.toFixed(2)} incl. VAT buffer`,
          evidence: `FX + tax uplift ${Math.round((countryMultiplier - 1) * 100)}% · REAL-074 country engine`,
          why: "Country-specific pricing protects margin after tax and logistics surcharges",
        };
      }
      case "marketplace_price": {
        const mpPrice = retail * marketplaceMultiplier;
        const score = economics.liveFeedAttached ? 78 : 58;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `List at $${mpPrice.toFixed(2)} on Amazon after ~15% referral fee`,
          evidence: `Marketplace fee stack ~$${(mpPrice * 0.15).toFixed(2)} · live feed ${economics.liveFeedAttached}`,
          why: "Marketplace fees are taken from gross — price must be set fee-inclusive",
        };
      }
      case "margin": {
        const score = marginPct;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: marginPct >= 40 ? "Margin supports paid acquisition" : "Raise price or reduce COGS before scaling ads",
          evidence: `Target margin ≥35% · current ${marginPct}% · net profit USD ${economics.netProfitUsd}`,
          why: "CONSTITUTION-023 — net profit before revenue vanity",
        };
      }
      case "promotion": {
        const score = activeProducts.length >= 2 ? 72 : 55;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: "Launch with 10% launch coupon — cap at 14 days",
          evidence: `${activeProducts.length} active SKUs · promotion window limits margin erosion`,
          why: "Time-boxed promotions accelerate reviews without training customers to wait",
        };
      }
      case "discount": {
        const score = marginPct >= 30 ? 65 : 42;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: marginPct >= 30 ? "Max 15% discount without bundle attachment" : "Avoid discounting — fix listing or supplier cost first",
          evidence: `Discount floor preserves ${Math.max(0, marginPct - 15)}% post-discount margin`,
          why: "Deep discounts on thin margin SKUs destroy SUCCESS-001 path",
        };
      }
      case "bundle": {
        const bundlePrice = retail * 1.75;
        const score = activeProducts.length >= 2 ? 80 : 52;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `Bundle complementary kitchen SKUs at $${bundlePrice.toFixed(2)} (+22% AOV target)`,
          evidence: `${activeProducts.length} candidates · post-purchase cross-sell REAL-041`,
          why: "Bundles lift AOV without proportional ad spend increase",
        };
      }
      case "psychological_pricing": {
        const psycho = psychologicalPrice(retail);
        const score = 76;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `Use charm price $${psycho.toFixed(2)} on primary marketplace`,
          evidence: `Anchor $${(psycho + 8).toFixed(2)} MSRP · charm delta improves CTR`,
          why: "Psychological pricing increases conversion without changing unit economics materially",
        };
      }
      case "profit_impact": {
        const unitProfit = retail - baseCost - retail * 0.15;
        const score = unitProfit > 8 ? 85 : unitProfit > 4 ? 65 : 40;
        return {
          itemId: `price-${dim}-${focus?.productId ?? "portfolio"}`,
          label: `${focus?.title ?? "Portfolio"} — ${PRICING_LABELS[dim]}`,
          score,
          status: itemStatus(score),
          recommendation: `Est. $${unitProfit.toFixed(2)} unit profit · ${commerceProgram?.nextCursorMission ?? "Complete commerce execution for live orders"}`,
          evidence: `MRR USD ${economics.monthlyRecurringRevenueUsd} · forecast USD ${economics.profitForecastUsd}`,
          why: "Every price decision must trace to verified net profit toward USD 100K",
        };
      }
    }
  });

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "global-price-intelligence",
    missionId: "REAL-075",
    workspaceId,
    companyId,
    summary: `${items.length} pricing dimensions for ${focus?.title ?? "portfolio"} · ${readyCount} ready · economics net USD ${economics.netProfitUsd}`,
    items,
    reusedModules: ["empire-economics", "grand-king-revenue-pipeline", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
