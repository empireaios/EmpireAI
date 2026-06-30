import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { DemandForecast } from "../models/demand-forecast.js";
import type { InventoryPredictionReportCreateInput } from "../models/inventory-prediction-report.js";
import type { InventorySignal, InventorySignalType } from "../models/inventory-signal.js";
import type { LeadTimeEstimate } from "../models/lead-time-estimate.js";
import type { RestockAlert } from "../models/restock-alert.js";
import type { SafetyStock } from "../models/safety-stock.js";
import type { SeasonalityProfile } from "../models/seasonality-profile.js";
import type { SupplierStock } from "../models/supplier-stock.js";

export const INVENTORY_SIGNAL_WEIGHTS: Record<InventorySignalType, number> = {
  demand_accuracy: 0.2,
  seasonality_fit: 0.14,
  supplier_availability: 0.16,
  lead_time_reliability: 0.14,
  safety_stock_adequacy: 0.16,
  restock_readiness: 0.18,
  inventory_composite: 0.02,
};

export type InventoryIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type InventoryIntelligenceProductInput = {
  productName: string;
  sku: string;
  category: string;
  currentStock?: number;
  supplierName?: string;
};

export type InventoryIntelligenceInput = {
  brand: InventoryIntelligenceBrandInput;
  product: InventoryIntelligenceProductInput;
  storeId: string;
  demandIndex?: number;
};

export type InventoryIntelligenceBreakdown = InventoryPredictionReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(signalType: InventorySignalType, score: number, detail: string): InventorySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: INVENTORY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: InventoryIntelligenceInput): number {
  const demandBoost = input.demandIndex ? Math.min(10, input.demandIndex / 10) : 5;
  return clampScore(input.brand.confidence * 0.5 + demandBoost + 20);
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function buildDemandForecast(input: InventoryIntelligenceInput): DemandForecast {
  const demandIndex = input.demandIndex ?? clampScore(input.brand.confidence * 0.85);
  const dailyUnits = clampScore(demandIndex / 5);
  const weeklyUnits = dailyUnits * 7;
  const monthlyUnits = dailyUnits * 30;
  const growthRate = demandIndex >= 75 ? 8.5 : demandIndex >= 60 ? 3.2 : -1.5;

  let trendDirection: DemandForecast["trendDirection"] = "STABLE";
  if (growthRate > 5) trendDirection = "RISING";
  else if (growthRate < 0) trendDirection = "FALLING";

  return {
    forecastId: randomUUID(),
    dailyUnits,
    weeklyUnits,
    monthlyUnits,
    trendDirection,
    growthRatePercent: growthRate,
    score: clampScore(baseScore(input) + (trendDirection === "RISING" ? 3 : 0)),
  };
}

function buildSeasonality(input: InventoryIntelligenceInput): SeasonalityProfile {
  const isKitchen = input.product.category.toLowerCase().includes("kitchen");

  return {
    profileId: randomUUID(),
    peakMonths: isKitchen ? ["November", "December", "January"] : ["June", "July", "August"],
    lowMonths: isKitchen ? ["February", "March"] : ["January", "February"],
    seasonalityIndex: clampScore(55 + input.brand.confidence * 0.15),
    peakMultiplier: 1.45,
    lowMultiplier: 0.72,
    score: clampScore(baseScore(input)),
  };
}

function buildSupplierStock(input: InventoryIntelligenceInput): SupplierStock[] {
  const supplier = input.product.supplierName ?? "CJ Dropshipping";
  const base = baseScore(input);
  const now = new Date().toISOString();

  return [
    {
      stockId: randomUUID(),
      supplierName: supplier,
      sku: input.product.sku,
      availableUnits: 420,
      reservedUnits: 35,
      status: "IN_STOCK",
      lastSyncedAt: now,
      score: clampScore(base + 4),
    },
    {
      stockId: randomUUID(),
      supplierName: supplier,
      sku: `${input.product.sku}-VAR`,
      availableUnits: 85,
      reservedUnits: 12,
      status: "LOW_STOCK",
      lastSyncedAt: now,
      score: clampScore(base - 5),
    },
  ];
}

function buildLeadTime(input: InventoryIntelligenceInput): LeadTimeEstimate {
  const supplier = input.product.supplierName ?? "CJ Dropshipping";

  return {
    estimateId: randomUUID(),
    supplierName: supplier,
    averageDays: 12,
    minDays: 7,
    maxDays: 21,
    reliabilityPercent: clampScore(78 + input.brand.confidence * 0.05),
    score: clampScore(baseScore(input) + 2),
  };
}

function buildSafetyStock(
  input: InventoryIntelligenceInput,
  demand: DemandForecast,
  leadTime: LeadTimeEstimate,
): SafetyStock {
  const currentUnits = input.product.currentStock ?? 145;
  const dailyDemand = demand.dailyUnits;
  const leadTimeBuffer = Math.ceil(dailyDemand * leadTime.averageDays * 1.2);
  const variabilityBuffer = Math.ceil(dailyDemand * 7);
  const recommendedUnits = leadTimeBuffer + variabilityBuffer;
  const reorderPoint = Math.ceil(dailyDemand * leadTime.averageDays + variabilityBuffer * 0.5);
  const daysOfCover = dailyDemand > 0 ? Math.round(currentUnits / dailyDemand) : 0;

  return {
    safetyStockId: randomUUID(),
    recommendedUnits,
    currentUnits,
    reorderPoint,
    daysOfCover,
    rationale: `Safety stock covers ${leadTime.averageDays}-day lead time plus 7-day demand variability buffer at ${dailyDemand} units/day.`,
    score: clampScore(
      currentUnits >= recommendedUnits ? baseScore(input) + 5 : baseScore(input) - 8,
    ),
  };
}

function buildRestockAlerts(
  input: InventoryIntelligenceInput,
  demand: DemandForecast,
  safety: SafetyStock,
  supplierStock: SupplierStock[],
): RestockAlert[] {
  const alerts: RestockAlert[] = [];
  const currentStock = safety.currentUnits;

  if (currentStock <= safety.reorderPoint) {
    const daysUntilStockout =
      demand.dailyUnits > 0 ? Math.max(0, Math.round(currentStock / demand.dailyUnits)) : 0;
    const orderQty = Math.max(
      safety.recommendedUnits - currentStock,
      Math.ceil(demand.weeklyUnits * 2),
    );

    alerts.push({
      alertId: randomUUID(),
      sku: input.product.sku,
      productName: input.product.productName,
      priority: daysUntilStockout <= 7 ? "CRITICAL" : daysUntilStockout <= 14 ? "HIGH" : "MEDIUM",
      currentStock,
      recommendedOrderQty: orderQty,
      daysUntilStockout,
      message: `Restock ${input.product.productName} — ${daysUntilStockout} days until stockout at current demand.`,
      status: "PLANNED",
      score: clampScore(baseScore(input) + (daysUntilStockout <= 7 ? -5 : 0)),
    });
  }

  for (const stock of supplierStock) {
    if (stock.status === "LOW_STOCK" || stock.status === "OUT_OF_STOCK") {
      alerts.push({
        alertId: randomUUID(),
        sku: stock.sku,
        productName: input.product.productName,
        priority: stock.status === "OUT_OF_STOCK" ? "CRITICAL" : "HIGH",
        currentStock: stock.availableUnits,
        recommendedOrderQty: Math.ceil(demand.monthlyUnits * 0.5),
        daysUntilStockout: stock.status === "OUT_OF_STOCK" ? 0 : 10,
        message: `Supplier ${stock.supplierName} reports ${stock.status.replace("_", " ").toLowerCase()} for SKU ${stock.sku}.`,
        status: "PLANNED",
        score: clampScore(baseScore(input) - 10),
      });
    }
  }

  return alerts.sort((left, right) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[left.priority] - order[right.priority];
  });
}

function buildSignals(
  demand: DemandForecast,
  seasonality: SeasonalityProfile,
  supplierStock: SupplierStock[],
  leadTime: LeadTimeEstimate,
  safety: SafetyStock,
  alerts: RestockAlert[],
  confidence: number,
): InventorySignal[] {
  return [
    buildSignal("demand_accuracy", demand.score, `Demand forecast ${demand.trendDirection} at ${demand.dailyUnits} units/day`),
    buildSignal("seasonality_fit", seasonality.score, `Seasonality index ${seasonality.seasonalityIndex}/100`),
    buildSignal(
      "supplier_availability",
      average(supplierStock.map((stock) => stock.score)),
      `${supplierStock.filter((stock) => stock.status === "IN_STOCK").length}/${supplierStock.length} SKUs in stock`,
    ),
    buildSignal(
      "lead_time_reliability",
      leadTime.score,
      `Lead time ${leadTime.averageDays} days (${leadTime.reliabilityPercent}% reliable)`,
    ),
    buildSignal(
      "safety_stock_adequacy",
      safety.score,
      `${safety.daysOfCover} days of cover — reorder point ${safety.reorderPoint}`,
    ),
    buildSignal(
      "restock_readiness",
      alerts.length > 0 ? clampScore(70 - alerts.length * 5) : 85,
      `${alerts.length} restock alerts planned`,
    ),
    buildSignal("inventory_composite", confidence, `Inventory prediction confidence ${confidence}`),
  ];
}

function computeConfidence(signals: InventorySignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "inventory_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "inventory_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  demand: DemandForecast,
  safety: SafetyStock,
  alerts: RestockAlert[],
): number {
  const alertPenalty = alerts.filter((alert) => alert.priority === "CRITICAL").length * 8;
  return clampScore(average([demand.score, safety.score]) - alertPenalty);
}

function computeStockoutDate(
  safety: SafetyStock,
  demand: DemandForecast,
): string | null {
  if (demand.dailyUnits <= 0) return null;
  const days = Math.round(safety.currentUnits / demand.dailyUnits);
  return days <= 30 ? addDaysIso(days) : null;
}

/** Generates inventory prediction report — intelligence only, no auto-order. */
export function generateInventoryPrediction(
  input: InventoryIntelligenceInput,
): InventoryIntelligenceBreakdown {
  const demandForecast = buildDemandForecast(input);
  const seasonality = buildSeasonality(input);
  const supplierStock = buildSupplierStock(input);
  const leadTime = buildLeadTime(input);
  const safetyStock = buildSafetyStock(input, demandForecast, leadTime);
  const restockAlerts = buildRestockAlerts(input, demandForecast, safetyStock, supplierStock);
  const predictedStockoutDate = computeStockoutDate(safetyStock, demandForecast);

  const provisionalSignals = buildSignals(
    demandForecast,
    seasonality,
    supplierStock,
    leadTime,
    safetyStock,
    restockAlerts,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    demandForecast,
    seasonality,
    supplierStock,
    leadTime,
    safetyStock,
    restockAlerts,
    confidence,
  );
  const overallScore = computeOverallScore(demandForecast, safetyStock, restockAlerts);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Inventory Prediction`,
    demandForecast,
    seasonality,
    supplierStock,
    leadTime,
    safetyStock,
    restockAlerts,
    predictedStockoutDate,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoOrderEnabled: false,
  };
}

export const inventoryIntelligenceScoring = {
  generateInventoryPrediction,
  computeConfidence,
  computeOverallScore,
  INVENTORY_SIGNAL_WEIGHTS,
};
