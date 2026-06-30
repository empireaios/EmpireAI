import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildOperationFirstDollarDashboard } from "../../../operation-first-dollar/services/operation-first-dollar-service.js";
import type { CostLineItem, EmpireEconomicsDashboard } from "../models/empire-economics.js";

const INFRA_COST_ESTIMATES: Array<Omit<CostLineItem, "evidence"> & { evidence: string }> = [
  { category: "HOSTING", provider: "vercel", label: "Vercel hosting", monthlyUsd: 20, recurring: true, evidence: "Platform catalog — infrastructure" },
  { category: "DEVELOPMENT", provider: "cursor", label: "Cursor IDE", monthlyUsd: 20, recurring: true, evidence: "Platform catalog — architecture only" },
  { category: "AI", provider: "openai", label: "OpenAI API", monthlyUsd: 45, recurring: true, evidence: "OAR creative_ai platform" },
  { category: "AI", provider: "anthropic", label: "Anthropic API", monthlyUsd: 25, recurring: true, evidence: "OAR creative_ai platform" },
  { category: "AI", provider: "google-ai", label: "Google AI", monthlyUsd: 15, recurring: true, evidence: "OAR creative_ai platform" },
  { category: "DEVELOPMENT", provider: "github", label: "GitHub", monthlyUsd: 0, recurring: true, evidence: "Platform catalog" },
  { category: "DATABASE", provider: "sqlite", label: "Database storage", monthlyUsd: 0, recurring: true, evidence: "Local/sql.js — production DB pending" },
  { category: "REDIS", provider: "redis", label: "Redis cache", monthlyUsd: 0, recurring: true, evidence: "Optional worker runtime" },
];

/** REAL-019 — Empire business economics (CONSTITUTION-023: net profit before revenue vanity). */
export function buildEmpireEconomics(
  workspaceId: string,
  companyId: string,
): EmpireEconomicsDashboard {
  seedRevenuePipeline(workspaceId, companyId);

  let mrr = 0;
  let marketplaceFees = 0;
  let paymentFees = 0;
  try {
    const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
    mrr = gmo.worldOverview.totalRevenueUsd;
    marketplaceFees = Math.round(mrr * 0.15);
    paymentFees = Math.round(mrr * 0.029);
  } catch { /* optional */ }

  const products = listPipelineProducts(workspaceId, companyId);
  const liveCount = products.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state)).length;
  const supplierCosts = liveCount * 120;
  const advertising = liveCount > 0 ? 200 : 0;
  const refunds = Math.round(mrr * 0.05);
  const chargebacks = Math.round(mrr * 0.01);

  const costBreakdown: CostLineItem[] = [
    ...INFRA_COST_ESTIMATES,
    { category: "MARKETPLACE_FEES", provider: "marketplaces", label: "Marketplace referral fees", monthlyUsd: marketplaceFees, recurring: true, evidence: "~15% of revenue (estimated until live feed)" },
    { category: "PAYMENT_GATEWAY", provider: "stripe", label: "Stripe processing", monthlyUsd: paymentFees, recurring: true, evidence: "~2.9% of revenue (estimated)" },
    { category: "ADVERTISING", provider: "meta-ads", label: "Advertising spend", monthlyUsd: advertising, recurring: true, evidence: "Meta Ads connector — architecture ready" },
    { category: "SUPPLIER", provider: "cj-dropshipping", label: "Supplier COGS", monthlyUsd: supplierCosts, recurring: true, evidence: `${liveCount} live products × est. unit cost` },
    { category: "REFUNDS", provider: "commerce", label: "Refund reserve", monthlyUsd: refunds, recurring: true, evidence: "5% revenue reserve (estimated)" },
    { category: "CHARGEBACKS", provider: "stripe", label: "Chargeback reserve", monthlyUsd: chargebacks, recurring: true, evidence: "1% revenue reserve (estimated)" },
  ];

  const infraMrc = costBreakdown.filter((c) =>
    ["HOSTING", "STORAGE", "DATABASE", "REDIS", "AI", "DEVELOPMENT", "SUBSCRIPTIONS"].includes(c.category),
  ).reduce((s, c) => s + c.monthlyUsd, 0);

  const variableCosts = marketplaceFees + paymentFees + advertising + supplierCosts + refunds + chargebacks;
  const monthlyRecurringCostUsd = infraMrc + variableCosts;
  const grossProfitUsd = mrr - supplierCosts - marketplaceFees;
  const netProfitUsd = mrr - monthlyRecurringCostUsd;
  const contributionMarginPercent = mrr > 0 ? Math.round((grossProfitUsd / mrr) * 100) : 0;
  const burnRateUsd = netProfitUsd < 0 ? Math.abs(netProfitUsd) : 0;
  const cashFlowUsd = netProfitUsd;
  const profitForecastUsd = netProfitUsd * 3;
  const breakEvenMonths = burnRateUsd > 0 && mrr > monthlyRecurringCostUsd
    ? Math.ceil(burnRateUsd / Math.max(mrr - infraMrc, 1))
    : mrr >= monthlyRecurringCostUsd ? 0 : null;
  const roiPercent = monthlyRecurringCostUsd > 0 ? Math.round((netProfitUsd / monthlyRecurringCostUsd) * 100) : 0;

  let liveFeed = false;
  try {
    const ofd = buildOperationFirstDollarDashboard(workspaceId, companyId);
    liveFeed = ofd.currentPhase === "FIRST_DOLLAR" || ofd.currentPhase === "PROFITABLE" || ofd.currentPhase === "SCALING";
  } catch { /* optional */ }

  return {
    moduleId: "empire-economics",
    missionId: "REAL-019",
    workspaceId,
    companyId,
    monthlyRecurringRevenueUsd: mrr,
    monthlyRecurringCostUsd,
    grossProfitUsd,
    netProfitUsd,
    contributionMarginPercent,
    cashFlowUsd,
    burnRateUsd,
    profitForecastUsd,
    breakEvenMonths,
    roiPercent,
    costBreakdown,
    revenueBreakdown: {
      marketplaceFeesUsd: marketplaceFees,
      paymentGatewayFeesUsd: paymentFees,
      advertisingUsd: advertising,
      supplierCostsUsd: supplierCosts,
      refundCostsUsd: refunds,
      chargebackCostsUsd: chargebacks,
    },
    architectureComplete: true,
    liveFeedAttached: liveFeed,
    computedAt: new Date().toISOString(),
  };
}
