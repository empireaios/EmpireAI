import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CampaignFailureDetection } from "../models/campaign-failure-detection.js";
import type { ChargebackRiskDetection } from "../models/chargeback-risk-detection.js";
import type { InventoryRiskDetection } from "../models/inventory-risk-detection.js";
import type { RiskAlert, RiskAlertCategory } from "../models/risk-alert.js";
import type { RiskDetectionReportCreateInput } from "../models/risk-detection-report.js";
import type {
  RiskDetectionSignal,
  RiskDetectionSignalType,
} from "../models/risk-detection-signal.js";
import type { SeoPenaltyDetection } from "../models/seo-penalty-detection.js";
import type { SupplierFailureDetection } from "../models/supplier-failure-detection.js";
import type {
  DetectionSeverity,
  TrafficDropDetection,
} from "../models/traffic-drop-detection.js";

export const RISK_DETECTION_SIGNAL_WEIGHTS: Record<RiskDetectionSignalType, number> = {
  traffic_drop: 0.16,
  supplier_failure: 0.16,
  campaign_failure: 0.16,
  chargeback_risk: 0.14,
  inventory_risk: 0.14,
  seo_penalty: 0.12,
  alert_coverage: 0.1,
  detection_composite: 0.02,
};

export type RiskDetectionBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type RiskDetectionMetricsInput = {
  currency?: string;
  dailyVisitors?: number;
  previousDailyVisitors?: number;
  supplierName?: string;
  monthlyOrders?: number;
  adSpendMonthly?: number;
  totalSkus?: number;
  organicTrafficChangePercent?: number;
};

export type RiskDetectionInput = {
  brand: RiskDetectionBrandInput;
  metrics: RiskDetectionMetricsInput;
  storeId: string;
  riskIndex?: number;
};

export type RiskDetectionBreakdown = RiskDetectionReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: RiskDetectionSignalType,
  score: number,
  detail: string,
): RiskDetectionSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: RISK_DETECTION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: RiskDetectionInput): number {
  const riskBoost = input.riskIndex ? Math.min(10, input.riskIndex / 10) : 5;
  return clampScore(input.brand.confidence * 0.4 + riskBoost + 20);
}

function resolveCurrency(input: RiskDetectionInput): string {
  return input.metrics.currency ?? "USD";
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function buildTrafficDropDetection(input: RiskDetectionInput): TrafficDropDetection {
  const current = input.metrics.dailyVisitors ?? 340;
  const previous = input.metrics.previousDailyVisitors ?? 420;
  const dropPercent = previous > 0
    ? Math.round(((previous - current) / previous) * 10000) / 100
    : 0;
  const thresholdPercent = 15;
  const detected = dropPercent >= thresholdPercent;
  const severity = dropPercent >= 30 ? "CRITICAL" : dropPercent >= thresholdPercent ? "HIGH" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? dropPercent * 0.3 : 0));

  return {
    detectionId: randomUUID(),
    currentDailyVisitors: current,
    previousDailyVisitors: previous,
    dropPercent: Math.max(0, dropPercent),
    thresholdPercent,
    detected,
    severity,
    score,
    summary: detected
      ? `Traffic drop detected — ${dropPercent}% decline (${current} vs ${previous} daily visitors).`
      : `Traffic stable — ${dropPercent}% change within ${thresholdPercent}% threshold.`,
  };
}

function buildSupplierFailureDetection(input: RiskDetectionInput): SupplierFailureDetection {
  const supplierName = input.metrics.supplierName ?? "CJ Dropshipping";
  const fulfillmentRate = input.riskIndex !== undefined && input.riskIndex < 65 ? 82 : 94;
  const failedOrders = fulfillmentRate < 90 ? 8 : 1;
  const detected = fulfillmentRate < 90 || failedOrders >= 5;
  const severity = fulfillmentRate < 85 ? "CRITICAL" : fulfillmentRate < 90 ? "HIGH" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? 15 : 0));

  return {
    detectionId: randomUUID(),
    supplierName,
    fulfillmentRatePercent: fulfillmentRate,
    failedOrders,
    averageLeadTimeDays: detected ? 18 : 12,
    detected,
    severity,
    score,
    summary: detected
      ? `Supplier failure detected — ${fulfillmentRate}% fulfillment, ${failedOrders} failed orders.`
      : `Supplier healthy — ${fulfillmentRate}% fulfillment rate.`,
  };
}

function buildCampaignFailureDetection(input: RiskDetectionInput): CampaignFailureDetection {
  const adSpend = input.metrics.adSpendMonthly ?? 4500;
  const targetRoas = 2.5;
  const currentRoas = input.riskIndex !== undefined && input.riskIndex < 70 ? 1.4 : 2.8;
  const detected = currentRoas < targetRoas;
  const spendWasted = detected ? Math.round(adSpend * 0.22) : 0;
  const severity = currentRoas < 1.5 ? "CRITICAL" : currentRoas < targetRoas ? "HIGH" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? 12 : 0));

  return {
    detectionId: randomUUID(),
    campaignName: "Q3 Meta Prospecting",
    channel: "Meta Ads",
    currentRoas,
    targetRoas,
    spendWasted,
    detected,
    severity,
    currency: resolveCurrency(input),
    score,
    summary: detected
      ? `Campaign failure — ROAS ${currentRoas}x below target ${targetRoas}x, ~${resolveCurrency(input)} ${spendWasted} wasted.`
      : `Campaigns performing — ROAS ${currentRoas}x meets target.`,
  };
}

function buildChargebackRiskDetection(input: RiskDetectionInput): ChargebackRiskDetection {
  const monthlyOrders = input.metrics.monthlyOrders ?? 320;
  const thresholdPercent = 1.0;
  const chargebackRate = input.riskIndex !== undefined && input.riskIndex < 60 ? 1.8 : 0.6;
  const chargebackCount = Math.round(monthlyOrders * (chargebackRate / 100));
  const chargebackTotal = Math.round(chargebackCount * 89.99 * 100) / 100;
  const detected = chargebackRate >= thresholdPercent;
  const severity = chargebackRate >= 2 ? "CRITICAL" : chargebackRate >= thresholdPercent ? "HIGH" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? chargebackRate * 8 : 0));

  return {
    detectionId: randomUUID(),
    chargebackRatePercent: chargebackRate,
    thresholdPercent,
    chargebackCount,
    chargebackTotal,
    topReason: "Product not received",
    detected,
    severity,
    currency: resolveCurrency(input),
    score,
    summary: detected
      ? `Chargeback risk elevated — ${chargebackRate}% rate exceeds ${thresholdPercent}% threshold.`
      : `Chargeback risk normal — ${chargebackRate}% within threshold.`,
  };
}

function buildInventoryRiskDetection(input: RiskDetectionInput): InventoryRiskDetection {
  const totalSkus = input.metrics.totalSkus ?? 14;
  const lowStockSkus = input.riskIndex !== undefined && input.riskIndex < 75 ? 4 : 2;
  const outOfStockSkus = lowStockSkus >= 4 ? 1 : 0;
  const daysOfCover = outOfStockSkus > 0 ? 5 : lowStockSkus >= 3 ? 10 : 18;
  const reorderThresholdDays = 14;
  const detected = daysOfCover <= reorderThresholdDays || outOfStockSkus > 0;
  const predictedStockoutDate = detected && daysOfCover <= 14 ? addDaysIso(daysOfCover) : null;
  const severity = outOfStockSkus > 0 ? "CRITICAL" : daysOfCover <= 7 ? "HIGH" : detected ? "MEDIUM" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? 10 : 0));

  return {
    detectionId: randomUUID(),
    lowStockSkus,
    outOfStockSkus,
    daysOfCover,
    reorderThresholdDays,
    predictedStockoutDate,
    detected,
    severity,
    score,
    summary: detected
      ? `Inventory risk — ${lowStockSkus} low stock, ${outOfStockSkus} out of stock, ${daysOfCover} days cover.`
      : `Inventory healthy — ${daysOfCover} days of cover across ${totalSkus} SKUs.`,
  };
}

function buildSeoPenaltyDetection(input: RiskDetectionInput): SeoPenaltyDetection {
  const trafficChange = input.metrics.organicTrafficChangePercent ?? -22;
  const deindexedPages = trafficChange <= -20 ? 3 : 0;
  const rankingDropKeywords = trafficChange <= -15 ? 12 : 4;
  const detected = trafficChange <= -20 || deindexedPages > 0;
  const severity = trafficChange <= -35 ? "CRITICAL" : trafficChange <= -20 ? "HIGH" : detected ? "MEDIUM" : "LOW";
  const score = clampScore(baseScore(input) - (detected ? Math.abs(trafficChange) * 0.4 : 0));

  return {
    detectionId: randomUUID(),
    organicTrafficChangePercent: trafficChange,
    indexedPages: 48,
    deindexedPages,
    rankingDropKeywords,
    suspectedPenalty: detected ? "Manual action — thin content" : "None detected",
    detected,
    severity,
    score,
    summary: detected
      ? `SEO penalty suspected — organic traffic ${trafficChange}%, ${deindexedPages} pages deindexed.`
      : `SEO stable — organic traffic change ${trafficChange}% within normal variance.`,
  };
}

function buildAlerts(
  trafficDrop: TrafficDropDetection,
  supplierFailure: SupplierFailureDetection,
  campaignFailure: CampaignFailureDetection,
  chargebackRisk: ChargebackRiskDetection,
  inventoryRisk: InventoryRiskDetection,
  seoPenalty: SeoPenaltyDetection,
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  if (trafficDrop.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "TRAFFIC",
      severity: trafficDrop.severity,
      title: "Traffic drop detected",
      message: trafficDrop.summary,
      recommendedAction: "Audit ad campaigns, check site uptime, and review recent site changes.",
      actionRequired: trafficDrop.severity === "CRITICAL" || trafficDrop.severity === "HIGH",
    });
  }

  if (supplierFailure.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "SUPPLIER",
      severity: supplierFailure.severity,
      title: "Supplier fulfillment failure",
      message: supplierFailure.summary,
      recommendedAction: `Contact ${supplierFailure.supplierName} and activate backup supplier if delays persist.`,
      actionRequired: true,
    });
  }

  if (campaignFailure.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "CAMPAIGN",
      severity: campaignFailure.severity,
      title: "Campaign underperforming",
      message: campaignFailure.summary,
      recommendedAction: "Pause underperforming ad sets and reallocate budget to top ROAS campaigns.",
      actionRequired: true,
    });
  }

  if (chargebackRisk.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "CHARGEBACK",
      severity: chargebackRisk.severity,
      title: "Elevated chargeback risk",
      message: chargebackRisk.summary,
      recommendedAction: "Review fulfillment tracking, update product descriptions, and enable delivery confirmation.",
      actionRequired: chargebackRisk.severity !== "LOW",
    });
  }

  if (inventoryRisk.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "INVENTORY",
      severity: inventoryRisk.severity,
      title: "Inventory stockout risk",
      message: inventoryRisk.summary,
      recommendedAction: "Trigger restock order immediately and update product availability on storefront.",
      actionRequired: true,
    });
  }

  if (seoPenalty.detected) {
    alerts.push({
      alertId: randomUUID(),
      category: "SEO",
      severity: seoPenalty.severity,
      title: "SEO penalty suspected",
      message: seoPenalty.summary,
      recommendedAction: "Audit deindexed pages, improve thin content, and submit reconsideration request if manual action confirmed.",
      actionRequired: seoPenalty.severity === "CRITICAL" || seoPenalty.severity === "HIGH",
    });
  }

  const priorityOrder: Record<DetectionSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return alerts.sort(
    (left, right) => priorityOrder[left.severity] - priorityOrder[right.severity],
  );
}

function buildSignals(
  trafficDrop: TrafficDropDetection,
  supplierFailure: SupplierFailureDetection,
  campaignFailure: CampaignFailureDetection,
  chargebackRisk: ChargebackRiskDetection,
  inventoryRisk: InventoryRiskDetection,
  seoPenalty: SeoPenaltyDetection,
  alerts: RiskAlert[],
  confidence: number,
): RiskDetectionSignal[] {
  const categories = new Set<RiskAlertCategory>(alerts.map((alert) => alert.category));

  return [
    buildSignal("traffic_drop", trafficDrop.score, trafficDrop.summary),
    buildSignal("supplier_failure", supplierFailure.score, supplierFailure.summary),
    buildSignal("campaign_failure", campaignFailure.score, campaignFailure.summary),
    buildSignal("chargeback_risk", chargebackRisk.score, chargebackRisk.summary),
    buildSignal("inventory_risk", inventoryRisk.score, inventoryRisk.summary),
    buildSignal("seo_penalty", seoPenalty.score, seoPenalty.summary),
    buildSignal(
      "alert_coverage",
      clampScore(50 + alerts.length * 8 + categories.size * 5),
      `${alerts.length} alerts across ${categories.size} risk categories`,
    ),
    buildSignal("detection_composite", confidence, `Risk detection confidence ${confidence}`),
  ];
}

function computeConfidence(signals: RiskDetectionSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "detection_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "detection_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(detections: { score: number; detected: boolean }[]): number {
  const detectionPenalty = detections.filter((item) => item.detected).length * 8;
  return clampScore(average(detections.map((item) => item.score)) - detectionPenalty);
}

/** Generates risk detection report — intelligence only, no auto-intervention. */
export function generateRiskDetection(input: RiskDetectionInput): RiskDetectionBreakdown {
  const trafficDrop = buildTrafficDropDetection(input);
  const supplierFailure = buildSupplierFailureDetection(input);
  const campaignFailure = buildCampaignFailureDetection(input);
  const chargebackRisk = buildChargebackRiskDetection(input);
  const inventoryRisk = buildInventoryRiskDetection(input);
  const seoPenalty = buildSeoPenaltyDetection(input);

  const detections = [
    trafficDrop,
    supplierFailure,
    campaignFailure,
    chargebackRisk,
    inventoryRisk,
    seoPenalty,
  ];
  const alerts = buildAlerts(
    trafficDrop,
    supplierFailure,
    campaignFailure,
    chargebackRisk,
    inventoryRisk,
    seoPenalty,
  );

  const provisionalSignals = buildSignals(
    trafficDrop,
    supplierFailure,
    campaignFailure,
    chargebackRisk,
    inventoryRisk,
    seoPenalty,
    alerts,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    trafficDrop,
    supplierFailure,
    campaignFailure,
    chargebackRisk,
    inventoryRisk,
    seoPenalty,
    alerts,
    confidence,
  );
  const overallScore = computeOverallScore(detections);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Risk Detection`,
    trafficDrop,
    supplierFailure,
    campaignFailure,
    chargebackRisk,
    inventoryRisk,
    seoPenalty,
    alerts,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((alert) => alert.severity === "CRITICAL").length,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoInterventionEnabled: false,
  };
}

export const riskDetectionIntelligenceScoring = {
  generateRiskDetection,
  computeConfidence,
  computeOverallScore,
  RISK_DETECTION_SIGNAL_WEIGHTS,
};
