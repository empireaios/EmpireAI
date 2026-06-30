import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { EmpireHealthReportCreateInput } from "../models/empire-health-report.js";
import type { EmpireHealthScore, EmpireHealthTier } from "../models/empire-health-score.js";
import type { EmpireHealthSignal, EmpireHealthSignalType } from "../models/empire-health-signal.js";
import type { MarginHealth } from "../models/margin-health.js";
import type { MarketingHealth } from "../models/marketing-health.js";
import type { OrdersHealth } from "../models/orders-health.js";
import type { RefundsHealth } from "../models/refunds-health.js";
import type { RevenueHealth } from "../models/revenue-health.js";
import type { SupplierHealth } from "../models/supplier-health.js";
import type { TrafficHealth } from "../models/traffic-health.js";

export const EMPIRE_HEALTH_SIGNAL_WEIGHTS: Record<EmpireHealthSignalType, number> = {
  revenue_monitor: 0.18,
  traffic_monitor: 0.14,
  margin_monitor: 0.16,
  orders_monitor: 0.14,
  refunds_monitor: 0.1,
  supplier_monitor: 0.12,
  marketing_monitor: 0.14,
  empire_composite: 0.02,
};

type HealthStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export type EmpireHealthBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type EmpireHealthMetricsInput = {
  price?: number;
  currency?: string;
  monthlyOrders?: number;
  monthlyVisitors?: number;
  grossMarginPercent?: number;
  adSpendMonthly?: number;
  supplierName?: string;
};

export type EmpireHealthInput = {
  brand: EmpireHealthBrandInput;
  metrics: EmpireHealthMetricsInput;
  storeId: string;
  healthIndex?: number;
};

export type EmpireHealthBreakdown = EmpireHealthReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: EmpireHealthSignalType,
  score: number,
  detail: string,
): EmpireHealthSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: EMPIRE_HEALTH_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: EmpireHealthInput): number {
  const healthBoost = input.healthIndex ? Math.min(10, input.healthIndex / 10) : 5;
  return clampScore(input.brand.confidence * 0.45 + healthBoost + 22);
}

function resolveCurrency(input: EmpireHealthInput): string {
  return input.metrics.currency ?? "USD";
}

function resolveMonthlyOrders(input: EmpireHealthInput): number {
  return input.metrics.monthlyOrders ?? clampScore(input.brand.confidence / 2.5);
}

function resolveMonthlyVisitors(input: EmpireHealthInput): number {
  return input.metrics.monthlyVisitors ?? resolveMonthlyOrders(input) * 30;
}

function resolvePrice(input: EmpireHealthInput): number {
  return input.metrics.price ?? 89.99;
}

function statusFromScore(score: number): HealthStatus {
  if (score >= 75) return "HEALTHY";
  if (score >= 55) return "WARNING";
  return "CRITICAL";
}

function buildRevenueHealth(input: EmpireHealthInput): RevenueHealth {
  const monthlyOrders = resolveMonthlyOrders(input);
  const price = resolvePrice(input);
  const monthlyRevenue = monthlyOrders * price;
  const growthRate = input.healthIndex !== undefined
    ? input.healthIndex >= 80 ? 9.2 : input.healthIndex >= 65 ? 4.5 : 0.8
    : 5.5;
  const targetPercent = 85;
  const score = clampScore(baseScore(input) + (growthRate >= 5 ? 5 : -3));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    dailyRevenue: Math.round((monthlyRevenue / 30) * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    growthRatePercent: growthRate,
    targetPercent,
    status,
    currency: resolveCurrency(input),
    score,
    summary: `Revenue ${status.toLowerCase()} — ${growthRate}% MoM growth, ${targetPercent}% of target.`,
  };
}

function buildTrafficHealth(input: EmpireHealthInput): TrafficHealth {
  const monthlyVisitors = resolveMonthlyVisitors(input);
  const monthlyOrders = resolveMonthlyOrders(input);
  const bounceRate = clampScore(46 - input.brand.confidence * 0.1);
  const conversionRate = monthlyVisitors > 0
    ? Math.round((monthlyOrders / monthlyVisitors) * 10000) / 100
    : 0;
  const score = clampScore(baseScore(input) + (conversionRate >= 2.5 ? 4 : -2));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    dailyVisitors: Math.round(monthlyVisitors / 30),
    monthlyVisitors,
    bounceRatePercent: bounceRate,
    conversionRatePercent: conversionRate,
    status,
    topSource: "Paid Social",
    score,
    summary: `Traffic ${status.toLowerCase()} — ${monthlyVisitors.toLocaleString()} monthly visitors at ${conversionRate}% CVR.`,
  };
}

function buildMarginHealth(input: EmpireHealthInput, revenue: RevenueHealth): MarginHealth {
  const grossMargin = input.metrics.grossMarginPercent ?? 56;
  const netMargin = grossMargin * 0.4;
  const targetGross = 55;
  const cogs = revenue.monthlyRevenue * (1 - grossMargin / 100);
  const score = clampScore(baseScore(input) + (grossMargin >= targetGross ? 5 : -5));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    grossMarginPercent: grossMargin,
    netMarginPercent: Math.round(netMargin * 10) / 10,
    targetGrossMarginPercent: targetGross,
    costOfGoodsSold: Math.round(cogs * 100) / 100,
    status,
    currency: revenue.currency,
    score,
    summary: `Margins ${status.toLowerCase()} — gross ${grossMargin}% vs target ${targetGross}%.`,
  };
}

function buildOrdersHealth(input: EmpireHealthInput, revenue: RevenueHealth): OrdersHealth {
  const monthlyOrders = resolveMonthlyOrders(input);
  const price = resolvePrice(input);
  const fulfillmentRate = clampScore(93 + input.brand.confidence * 0.04);
  const score = clampScore(baseScore(input) + (fulfillmentRate >= 95 ? 4 : 0));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    dailyOrders: Math.round(monthlyOrders / 30),
    monthlyOrders,
    averageOrderValue: price,
    fulfillmentRatePercent: fulfillmentRate,
    status,
    currency: revenue.currency,
    score,
    summary: `Orders ${status.toLowerCase()} — ${monthlyOrders} monthly orders at ${fulfillmentRate}% fulfillment.`,
  };
}

function buildRefundsHealth(input: EmpireHealthInput, revenue: RevenueHealth): RefundsHealth {
  const monthlyOrders = resolveMonthlyOrders(input);
  const refundRate = clampScore(4.5 - input.brand.confidence * 0.02);
  const refundCount = Math.round(monthlyOrders * (refundRate / 100));
  const refundTotal = Math.round(refundCount * resolvePrice(input) * 100) / 100;
  const targetRefundRate = 5;
  const score = clampScore(baseScore(input) + (refundRate <= targetRefundRate ? 5 : -8));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    refundRatePercent: refundRate,
    refundCount,
    refundTotal,
    targetRefundRatePercent: targetRefundRate,
    topReason: "Product not as described",
    status,
    currency: revenue.currency,
    score,
    summary: `Refunds ${status.toLowerCase()} — ${refundRate}% rate vs ${targetRefundRate}% target.`,
  };
}

function buildSupplierHealth(input: EmpireHealthInput): SupplierHealth {
  const supplierName = input.metrics.supplierName ?? "CJ Dropshipping";
  const fulfillmentRate = clampScore(94 + input.brand.confidence * 0.03);
  const stockoutIncidents = input.healthIndex !== undefined && input.healthIndex < 65 ? 2 : 0;
  const score = clampScore(baseScore(input) + (stockoutIncidents === 0 ? 4 : -10));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    activeSuppliers: 2,
    fulfillmentRatePercent: fulfillmentRate,
    averageLeadTimeDays: 12,
    stockoutIncidents,
    primarySupplier: supplierName,
    status,
    score,
    summary: `Supplier ${status.toLowerCase()} — ${fulfillmentRate}% fulfillment via ${supplierName}.`,
  };
}

function buildMarketingHealth(input: EmpireHealthInput, revenue: RevenueHealth): MarketingHealth {
  const adSpend = input.metrics.adSpendMonthly ?? Math.round(revenue.monthlyRevenue * 0.24);
  const revenueFromAds = revenue.monthlyRevenue * 0.6;
  const roas = adSpend > 0 ? Math.round((revenueFromAds / adSpend) * 100) / 100 : 0;
  const cpa = resolveMonthlyOrders(input) > 0
    ? Math.round((adSpend / resolveMonthlyOrders(input)) * 100) / 100
    : 0;
  const score = clampScore(baseScore(input) + (roas >= 2.5 ? 6 : roas >= 1.8 ? 0 : -6));
  const status = statusFromScore(score);

  return {
    monitorId: randomUUID(),
    activeCampaigns: 5,
    roas,
    costPerAcquisition: cpa,
    emailOpenRatePercent: clampScore(30 + input.brand.confidence * 0.12),
    topChannel: "Meta Ads",
    status,
    currency: revenue.currency,
    score,
    summary: `Marketing ${status.toLowerCase()} — ROAS ${roas}x, CPA ${revenue.currency} ${cpa}.`,
  };
}

function buildEmpireHealthScore(monitors: { score: number; status: HealthStatus }[]): EmpireHealthScore {
  const overallScore = clampScore(average(monitors.map((monitor) => monitor.score)));
  const healthyDimensions = monitors.filter((monitor) => monitor.status === "HEALTHY").length;
  const warningDimensions = monitors.filter((monitor) => monitor.status === "WARNING").length;
  const criticalDimensions = monitors.filter((monitor) => monitor.status === "CRITICAL").length;

  let tier: EmpireHealthTier = "FAIR";
  if (overallScore >= 85) tier = "EXCELLENT";
  else if (overallScore >= 72) tier = "GOOD";
  else if (overallScore >= 55) tier = "FAIR";
  else if (overallScore >= 40) tier = "POOR";
  else tier = "CRITICAL";

  return {
    scoreId: randomUUID(),
    overallScore,
    tier,
    healthyDimensions,
    warningDimensions,
    criticalDimensions,
    headline: `Empire Health Score: ${overallScore}/100 — ${tier}`,
    summary: `${healthyDimensions} healthy, ${warningDimensions} warning, ${criticalDimensions} critical dimensions.`,
  };
}

function buildSignals(
  revenue: RevenueHealth,
  traffic: TrafficHealth,
  margins: MarginHealth,
  orders: OrdersHealth,
  refunds: RefundsHealth,
  supplier: SupplierHealth,
  marketing: MarketingHealth,
  empireHealthScore: EmpireHealthScore,
  confidence: number,
): EmpireHealthSignal[] {
  return [
    buildSignal("revenue_monitor", revenue.score, revenue.summary),
    buildSignal("traffic_monitor", traffic.score, traffic.summary),
    buildSignal("margin_monitor", margins.score, margins.summary),
    buildSignal("orders_monitor", orders.score, orders.summary),
    buildSignal("refunds_monitor", refunds.score, refunds.summary),
    buildSignal("supplier_monitor", supplier.score, supplier.summary),
    buildSignal("marketing_monitor", marketing.score, marketing.summary),
    buildSignal(
      "empire_composite",
      confidence,
      `Empire Health Score ${empireHealthScore.overallScore} — ${empireHealthScore.tier}`,
    ),
  ];
}

function computeConfidence(signals: EmpireHealthSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "empire_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "empire_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

/** Generates empire health monitoring report — intelligence only, no auto-intervention. */
export function generateEmpireHealthReport(input: EmpireHealthInput): EmpireHealthBreakdown {
  const revenue = buildRevenueHealth(input);
  const traffic = buildTrafficHealth(input);
  const margins = buildMarginHealth(input, revenue);
  const orders = buildOrdersHealth(input, revenue);
  const refunds = buildRefundsHealth(input, revenue);
  const supplier = buildSupplierHealth(input);
  const marketing = buildMarketingHealth(input, revenue);

  const monitors = [revenue, traffic, margins, orders, refunds, supplier, marketing];
  const empireHealthScore = buildEmpireHealthScore(monitors);

  const provisionalSignals = buildSignals(
    revenue,
    traffic,
    margins,
    orders,
    refunds,
    supplier,
    marketing,
    empireHealthScore,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    revenue,
    traffic,
    margins,
    orders,
    refunds,
    supplier,
    marketing,
    empireHealthScore,
    confidence,
  );

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Empire Health Monitor`,
    revenue,
    traffic,
    margins,
    orders,
    refunds,
    supplier,
    marketing,
    empireHealthScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoInterventionEnabled: false,
  };
}

export const empireHealthIntelligenceScoring = {
  generateEmpireHealthReport,
  computeConfidence,
  EMPIRE_HEALTH_SIGNAL_WEIGHTS,
};
