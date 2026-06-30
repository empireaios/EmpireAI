import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AlertsWidget, DashboardAlert } from "../models/alerts-widget.js";
import type { ExecutiveDashboardReportCreateInput } from "../models/executive-dashboard-report.js";
import type {
  ExecutiveDashboardSignal,
  ExecutiveDashboardSignalType,
} from "../models/executive-dashboard-signal.js";
import type { EyeWidget } from "../models/eye-widget.js";
import type { InventoryWidget } from "../models/inventory-widget.js";
import type { ManufacturingWidget } from "../models/manufacturing-widget.js";
import type { MarketingWidget } from "../models/marketing-widget.js";
import type { OrdersWidget } from "../models/orders-widget.js";
import type { ProfitWidget } from "../models/profit-widget.js";
import type { RevenueWidget } from "../models/revenue-widget.js";
import type { RoasWidget } from "../models/roas-widget.js";
import type { VisitorsWidget } from "../models/visitors-widget.js";

export const EXECUTIVE_DASHBOARD_SIGNAL_WEIGHTS: Record<ExecutiveDashboardSignalType, number> = {
  revenue_health: 0.14,
  orders_velocity: 0.12,
  traffic_quality: 0.1,
  roas_efficiency: 0.12,
  profit_margin: 0.12,
  inventory_stability: 0.1,
  marketing_performance: 0.1,
  manufacturing_throughput: 0.08,
  eye_intelligence: 0.08,
  alert_burden: 0.02,
  dashboard_composite: 0.02,
};

export type ExecutiveDashboardBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type ExecutiveDashboardMetricsInput = {
  price?: number;
  currency?: string;
  monthlyOrders?: number;
  monthlyVisitors?: number;
  adSpendMonthly?: number;
  grossMarginPercent?: number;
  totalSkus?: number;
  activeCampaigns?: number;
};

export type ExecutiveDashboardInput = {
  brand: ExecutiveDashboardBrandInput;
  metrics: ExecutiveDashboardMetricsInput;
  storeId: string;
  performanceIndex?: number;
};

export type ExecutiveDashboardBreakdown = ExecutiveDashboardReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: ExecutiveDashboardSignalType,
  score: number,
  detail: string,
): ExecutiveDashboardSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: EXECUTIVE_DASHBOARD_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: ExecutiveDashboardInput): number {
  const performanceBoost = input.performanceIndex
    ? Math.min(12, input.performanceIndex / 8)
    : 6;
  return clampScore(input.brand.confidence * 0.45 + performanceBoost + 20);
}

function resolveCurrency(input: ExecutiveDashboardInput): string {
  return input.metrics.currency ?? "USD";
}

function resolveMonthlyOrders(input: ExecutiveDashboardInput): number {
  return input.metrics.monthlyOrders ?? clampScore(input.brand.confidence / 2.5);
}

function resolveMonthlyVisitors(input: ExecutiveDashboardInput): number {
  return input.metrics.monthlyVisitors ?? resolveMonthlyOrders(input) * 28;
}

function resolvePrice(input: ExecutiveDashboardInput): number {
  return input.metrics.price ?? 79.99;
}

function buildRevenueWidget(input: ExecutiveDashboardInput): RevenueWidget {
  const monthlyOrders = resolveMonthlyOrders(input);
  const price = resolvePrice(input);
  const monthlyRevenue = monthlyOrders * price;
  const growthRate = input.performanceIndex !== undefined
    ? input.performanceIndex >= 80
      ? 11.2
      : input.performanceIndex >= 65
        ? 5.8
        : 1.4
    : 6.5;

  let trend: RevenueWidget["trend"] = "FLAT";
  if (growthRate > 5) trend = "UP";
  else if (growthRate < 2) trend = "DOWN";

  return {
    widgetId: randomUUID(),
    totalRevenue: Math.round(monthlyRevenue * 6 * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    dailyAverage: Math.round((monthlyRevenue / 30) * 100) / 100,
    growthRatePercent: growthRate,
    trend,
    currency: resolveCurrency(input),
    score: clampScore(baseScore(input) + (trend === "UP" ? 5 : 0)),
    summary: `${input.brand.brandName} revenue trending ${trend.toLowerCase()} at ${growthRate}% MoM.`,
  };
}

function buildOrdersWidget(input: ExecutiveDashboardInput, revenue: RevenueWidget): OrdersWidget {
  const monthlyOrders = resolveMonthlyOrders(input);
  const monthlyVisitors = resolveMonthlyVisitors(input);
  const price = resolvePrice(input);
  const conversionRate = monthlyVisitors > 0
    ? Math.round((monthlyOrders / monthlyVisitors) * 10000) / 100
    : 0;

  return {
    widgetId: randomUUID(),
    totalOrders: monthlyOrders * 6,
    monthlyOrders,
    averageOrderValue: price,
    conversionRatePercent: conversionRate,
    fulfillmentRatePercent: clampScore(92 + input.brand.confidence * 0.05),
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (conversionRate >= 2 ? 4 : 0)),
    summary: `${monthlyOrders} orders this month at ${conversionRate}% conversion.`,
  };
}

function buildVisitorsWidget(input: ExecutiveDashboardInput): VisitorsWidget {
  const monthlyVisitors = resolveMonthlyVisitors(input);
  const bounceRate = clampScore(48 - input.brand.confidence * 0.12);

  return {
    widgetId: randomUUID(),
    totalVisitors: monthlyVisitors * 6,
    monthlyVisitors,
    uniqueVisitors: Math.round(monthlyVisitors * 0.78),
    bounceRatePercent: bounceRate,
    sessionDurationSeconds: clampScore(95 + input.brand.confidence * 0.4),
    topSource: "Paid Social",
    score: clampScore(baseScore(input) + (bounceRate <= 45 ? 4 : -2)),
    summary: `${monthlyVisitors.toLocaleString()} monthly visitors — bounce rate ${bounceRate}%.`,
  };
}

function buildRoasWidget(input: ExecutiveDashboardInput, revenue: RevenueWidget): RoasWidget {
  const adSpend = input.metrics.adSpendMonthly ?? Math.round(revenue.monthlyRevenue * 0.22);
  const grossMargin = input.metrics.grossMarginPercent ?? 55;
  const breakEvenRoas = grossMargin > 0 ? Math.round((100 / grossMargin) * 100) / 100 : 2;
  const revenueFromAds = Math.round(revenue.monthlyRevenue * 0.62 * 100) / 100;
  const currentRoas = adSpend > 0 ? Math.round((revenueFromAds / adSpend) * 100) / 100 : 0;
  const targetRoas = Math.round(breakEvenRoas * 1.35 * 100) / 100;

  return {
    widgetId: randomUUID(),
    currentRoas,
    targetRoas,
    breakEvenRoas,
    adSpendMonthly: adSpend,
    revenueFromAds,
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (currentRoas >= breakEvenRoas ? 6 : -6)),
    summary: `ROAS ${currentRoas}x vs target ${targetRoas}x (break-even ${breakEvenRoas}x).`,
  };
}

function buildProfitWidget(input: ExecutiveDashboardInput, revenue: RevenueWidget): ProfitWidget {
  const grossMargin = input.metrics.grossMarginPercent ?? 55;
  const netMargin = grossMargin * 0.4;
  const grossProfit = revenue.monthlyRevenue * (grossMargin / 100);
  const netProfit = revenue.monthlyRevenue * (netMargin / 100);

  return {
    widgetId: randomUUID(),
    netProfit: Math.round(netProfit * 6 * 100) / 100,
    grossProfit: Math.round(grossProfit * 6 * 100) / 100,
    grossMarginPercent: grossMargin,
    netMarginPercent: Math.round(netMargin * 10) / 10,
    monthlyProfit: Math.round(netProfit * 100) / 100,
    currency: revenue.currency,
    score: clampScore(baseScore(input) + (netMargin >= 18 ? 5 : -3)),
    summary: `Net margin ${Math.round(netMargin * 10) / 10}% — ${revenue.currency} ${Math.round(netProfit).toLocaleString()} monthly profit.`,
  };
}

function buildInventoryWidget(input: ExecutiveDashboardInput): InventoryWidget {
  const totalSkus = input.metrics.totalSkus ?? 12;
  const lowStockSkus = totalSkus >= 8 ? 2 : 1;
  const outOfStockSkus = 0;
  const inStockSkus = totalSkus - lowStockSkus - outOfStockSkus;
  const daysOfCover = clampScore(18 + input.brand.confidence * 0.08);
  const restockAlerts = lowStockSkus + outOfStockSkus;

  let status: InventoryWidget["status"] = "HEALTHY";
  if (outOfStockSkus > 0) status = "CRITICAL";
  else if (lowStockSkus >= 2) status = "LOW";

  return {
    widgetId: randomUUID(),
    totalSkus,
    inStockSkus,
    lowStockSkus,
    outOfStockSkus,
    daysOfCover,
    restockAlerts,
    status,
    score: clampScore(baseScore(input) + (status === "HEALTHY" ? 6 : status === "LOW" ? 0 : -10)),
    summary: `${inStockSkus}/${totalSkus} SKUs in stock — ${daysOfCover} days of cover.`,
  };
}

function buildMarketingWidget(input: ExecutiveDashboardInput): MarketingWidget {
  const activeCampaigns = input.metrics.activeCampaigns ?? 4;

  return {
    widgetId: randomUUID(),
    activeCampaigns,
    emailOpenRatePercent: clampScore(28 + input.brand.confidence * 0.15),
    clickThroughRatePercent: clampScore(2.4 + input.brand.confidence * 0.02),
    costPerAcquisition: Math.round(resolvePrice(input) * 0.28 * 100) / 100,
    topChannel: "Meta Ads",
    currency: resolveCurrency(input),
    score: clampScore(baseScore(input) + 2),
    summary: `${activeCampaigns} active campaigns — Meta Ads leading channel.`,
  };
}

function buildManufacturingWidget(input: ExecutiveDashboardInput): ManufacturingWidget {
  const queuedProjects = input.performanceIndex !== undefined && input.performanceIndex >= 75 ? 2 : 1;

  return {
    widgetId: randomUUID(),
    activeLoops: 1,
    completedProjects: 3,
    queuedProjects,
    successRatePercent: clampScore(82 + input.brand.confidence * 0.06),
    averageCycleDays: 14,
    status: queuedProjects > 0 ? "RUNNING" : "IDLE",
    score: clampScore(baseScore(input) + 1),
    summary: `Manufacturing loop running — ${queuedProjects} projects queued.`,
  };
}

function buildEyeWidget(input: ExecutiveDashboardInput): EyeWidget {
  return {
    widgetId: randomUUID(),
    activeConnectors: 3,
    signalsIngested: clampScore(120 + input.brand.confidence),
    competitorAlerts: 2,
    trendSignals: clampScore(8 + input.brand.confidence * 0.05),
    lastSyncAt: new Date().toISOString(),
    topInsight: `${input.brand.niche} demand rising — competitor pricing stable.`,
    score: clampScore(baseScore(input) + 3),
    summary: "Eye ingesting competitor and trend signals across 3 connectors.",
  };
}

function buildAlertsWidget(
  input: ExecutiveDashboardInput,
  inventory: InventoryWidget,
  roas: RoasWidget,
): AlertsWidget {
  const alerts: DashboardAlert[] = [];

  if (inventory.status === "LOW" || inventory.status === "CRITICAL") {
    alerts.push({
      alertId: randomUUID(),
      category: "INVENTORY",
      severity: inventory.status === "CRITICAL" ? "CRITICAL" : "HIGH",
      title: "Low stock detected",
      message: `${inventory.lowStockSkus} SKUs below reorder threshold.`,
      actionRequired: true,
    });
  }

  if (roas.currentRoas < roas.breakEvenRoas) {
    alerts.push({
      alertId: randomUUID(),
      category: "MARKETING",
      severity: "HIGH",
      title: "ROAS below break-even",
      message: `Current ROAS ${roas.currentRoas}x is below break-even ${roas.breakEvenRoas}x.`,
      actionRequired: true,
    });
  }

  alerts.push({
    alertId: randomUUID(),
    category: "EYE",
    severity: "MEDIUM",
    title: "Competitor price watch",
    message: `New competitor activity detected in ${input.brand.niche}.`,
    actionRequired: false,
  });

  const criticalCount = alerts.filter((alert) => alert.severity === "CRITICAL").length;
  const highCount = alerts.filter((alert) => alert.severity === "HIGH").length;

  return {
    widgetId: randomUUID(),
    totalAlerts: alerts.length,
    criticalCount,
    highCount,
    alerts,
    score: clampScore(100 - criticalCount * 20 - highCount * 10),
    summary: `${alerts.length} active alerts — ${criticalCount} critical, ${highCount} high.`,
  };
}

function buildSignals(
  revenue: RevenueWidget,
  orders: OrdersWidget,
  visitors: VisitorsWidget,
  roas: RoasWidget,
  profit: ProfitWidget,
  inventory: InventoryWidget,
  marketing: MarketingWidget,
  manufacturing: ManufacturingWidget,
  eye: EyeWidget,
  alerts: AlertsWidget,
  confidence: number,
): ExecutiveDashboardSignal[] {
  return [
    buildSignal("revenue_health", revenue.score, revenue.summary),
    buildSignal("orders_velocity", orders.score, orders.summary),
    buildSignal("traffic_quality", visitors.score, visitors.summary),
    buildSignal("roas_efficiency", roas.score, roas.summary),
    buildSignal("profit_margin", profit.score, profit.summary),
    buildSignal("inventory_stability", inventory.score, inventory.summary),
    buildSignal("marketing_performance", marketing.score, marketing.summary),
    buildSignal("manufacturing_throughput", manufacturing.score, manufacturing.summary),
    buildSignal("eye_intelligence", eye.score, eye.summary),
    buildSignal("alert_burden", alerts.score, alerts.summary),
    buildSignal("dashboard_composite", confidence, `Executive dashboard confidence ${confidence}`),
  ];
}

function computeConfidence(signals: ExecutiveDashboardSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "dashboard_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "dashboard_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(widgets: { score: number }[], alerts: AlertsWidget): number {
  const alertPenalty = alerts.criticalCount * 8 + alerts.highCount * 4;
  return clampScore(average(widgets.map((widget) => widget.score)) - alertPenalty);
}

/** Generates executive dashboard report — intelligence only, no auto-refresh. */
export function generateExecutiveDashboard(
  input: ExecutiveDashboardInput,
): ExecutiveDashboardBreakdown {
  const revenue = buildRevenueWidget(input);
  const orders = buildOrdersWidget(input, revenue);
  const visitors = buildVisitorsWidget(input);
  const roas = buildRoasWidget(input, revenue);
  const profit = buildProfitWidget(input, revenue);
  const inventory = buildInventoryWidget(input);
  const marketing = buildMarketingWidget(input);
  const manufacturing = buildManufacturingWidget(input);
  const eye = buildEyeWidget(input);
  const alerts = buildAlertsWidget(input, inventory, roas);

  const provisionalSignals = buildSignals(
    revenue,
    orders,
    visitors,
    roas,
    profit,
    inventory,
    marketing,
    manufacturing,
    eye,
    alerts,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    revenue,
    orders,
    visitors,
    roas,
    profit,
    inventory,
    marketing,
    manufacturing,
    eye,
    alerts,
    confidence,
  );
  const overallScore = computeOverallScore(
    [revenue, orders, visitors, roas, profit, inventory, marketing, manufacturing, eye, alerts],
    alerts,
  );

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    dashboardName: `${input.brand.brandName} Executive Dashboard`,
    revenue,
    orders,
    visitors,
    roas,
    profit,
    inventory,
    marketing,
    manufacturing,
    eye,
    alerts,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoRefreshEnabled: false,
  };
}

export const executiveDashboardIntelligenceScoring = {
  generateExecutiveDashboard,
  computeConfidence,
  computeOverallScore,
  EXECUTIVE_DASHBOARD_SIGNAL_WEIGHTS,
};
