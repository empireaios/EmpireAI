import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryInventoryIntelligenceRepository,
  createInventoryIntelligenceModule,
  generateInventoryPrediction,
  RESTOCK_ALERT_PRIORITIES,
  SUPPLIER_STOCK_STATUSES,
  validateInventoryPredictionReport,
} from "../../execution/inventory-intelligence/index.js";

const WORKSPACE_ID = "ws-m089";

function buildInventoryInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 82,
    },
    product: {
      productName: "Premium Kitchen Blender",
      sku: "KBS-BLND-001",
      category: "Kitchen appliances",
      currentStock: 85,
      supplierName: "CJ Dropshipping",
    },
    storeId,
    demandIndex: 78,
  };
}

describe("Mission 089 Inventory Intelligence Engine", () => {
  it("generates inventory prediction with safety flags", async () => {
    const module = createInventoryIntelligenceModule();
    const record = await module.persistPrediction(WORKSPACE_ID, buildInventoryInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoOrderEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(record.signals.some((signal) => signal.signalType === "inventory_composite"));
  });

  it("forecasts demand with trend direction", () => {
    const demand = generateInventoryPrediction(buildInventoryInput()).demandForecast;

    assert.ok(demand.dailyUnits >= 0);
    assert.equal(demand.weeklyUnits, demand.dailyUnits * 7);
    assert.equal(demand.monthlyUnits, demand.dailyUnits * 30);
    assert.ok(["RISING", "STABLE", "FALLING"].includes(demand.trendDirection));
    assert.ok(demand.score >= 0 && demand.score <= 100);
  });

  it("tracks seasonality profile", () => {
    const seasonality = generateInventoryPrediction(buildInventoryInput()).seasonality;

    assert.ok(seasonality.peakMonths.length >= 1);
    assert.ok(seasonality.lowMonths.length >= 1);
    assert.ok(seasonality.peakMultiplier >= 1);
    assert.ok(seasonality.lowMultiplier <= 1);
    assert.ok(seasonality.seasonalityIndex >= 0 && seasonality.seasonalityIndex <= 100);
  });

  it("tracks supplier stock levels", () => {
    const stock = generateInventoryPrediction(buildInventoryInput()).supplierStock;

    assert.ok(stock.length >= 2);
    for (const entry of stock) {
      assert.ok(entry.availableUnits >= 0);
      assert.ok(SUPPLIER_STOCK_STATUSES.includes(entry.status));
      assert.ok(entry.lastSyncedAt.length > 0);
    }
    assert.ok(stock.some((entry) => entry.status === "IN_STOCK"));
  });

  it("estimates supplier lead time", () => {
    const leadTime = generateInventoryPrediction(buildInventoryInput()).leadTime;

    assert.ok(leadTime.averageDays >= leadTime.minDays);
    assert.ok(leadTime.maxDays >= leadTime.averageDays);
    assert.ok(leadTime.reliabilityPercent >= 0 && leadTime.reliabilityPercent <= 100);
    assert.match(leadTime.supplierName, /CJ Dropshipping/);
  });

  it("calculates safety stock and reorder point", () => {
    const safety = generateInventoryPrediction(buildInventoryInput()).safetyStock;

    assert.ok(safety.recommendedUnits >= 0);
    assert.ok(safety.reorderPoint >= 0);
    assert.ok(safety.daysOfCover >= 0);
    assert.ok(safety.rationale.length > 0);
    assert.equal(safety.currentUnits, 85);
  });

  it("generates restock alerts with PLANNED status", () => {
    const report = generateInventoryPrediction(buildInventoryInput());

    assert.ok(report.restockAlerts.length >= 1);
    for (const alert of report.restockAlerts) {
      assert.ok(RESTOCK_ALERT_PRIORITIES.includes(alert.priority));
      assert.equal(alert.status, "PLANNED");
      assert.ok(alert.recommendedOrderQty >= 1);
      assert.ok(alert.message.length > 0);
    }
  });

  it("predicts stockout date when cover is low", () => {
    const report = generateInventoryPrediction(buildInventoryInput());

    if (report.safetyStock.daysOfCover <= 30) {
      assert.ok(report.predictedStockoutDate);
    }
  });

  it("computes weighted confidence signals", () => {
    const report = generateInventoryPrediction(buildInventoryInput());

    assert.ok(report.signals.length >= 6);
    const composite = report.signals.find((signal) => signal.signalType === "inventory_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates inventory prediction report schema", () => {
    const report = generateInventoryPrediction(buildInventoryInput());
    const validated = validateInventoryPredictionReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.demandForecast.dailyUnits >= 0);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoOrderEnabled, false);
  });

  it("persists inventory intelligence records in the repository", async () => {
    const repository = createInMemoryInventoryIntelligenceRepository();
    const module = createInventoryIntelligenceModule(repository);
    const input = buildInventoryInput();

    const saved = await module.persistPrediction(WORKSPACE_ID, input);
    const loadedByStore = await module.getPredictionByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getPredictionRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.restockAlerts.length, saved.restockAlerts.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
