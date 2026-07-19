import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createCjDropshippingIntegrationEngine,
  resetCjDropshippingIntegrationForTesting,
} from "../../cj-dropshipping-integration/index.js";
import {
  createAliExpressIntegrationEngine,
  resetAliExpressIntegrationForTesting,
} from "../../aliexpress-integration/index.js";
import {
  createOss1688IntegrationEngine,
  resetOss1688IntegrationForTesting,
} from "../../1688-integration/index.js";
import {
  createSupplierProductSyncEngine,
  resetSupplierProductSyncForTesting,
} from "../../supplier-product-sync/index.js";
import {
  createSupplierInventorySyncEngine,
  resetSupplierInventorySyncForTesting,
} from "../../supplier-inventory-sync/index.js";
import {
  createSupplierPricingEngine,
  resetSupplierPricingEngineForTesting,
} from "../../supplier-pricing-engine/index.js";
import {
  createSupplierRankingEngine,
  resetSupplierRankingEngineForTesting,
} from "../../supplier-ranking-engine/index.js";
import {
  createProcurementEngine,
  resetProcurementEngineForTesting,
} from "../../procurement-engine/index.js";
import {
  createFulfilmentOrchestrator,
  resetFulfilmentOrchestratorForTesting,
} from "../../fulfilment-orchestrator/index.js";
import {
  createShippingCarrierIntegrationEngine,
  resetShippingCarrierIntegrationForTesting,
} from "../../shipping-carrier-integration/index.js";
import {
  createShipmentTrackingEngine,
  resetShipmentTrackingEngineForTesting,
} from "../../shipment-tracking-engine/index.js";
import {
  createReturnManagementEngine,
  resetReturnManagementForTesting,
} from "../../return-management/index.js";
import {
  createWarehouseIntelligenceEngine,
  resetWarehouseIntelligenceForTesting,
} from "../../warehouse-intelligence/index.js";
import {
  createMultiWarehouseSupportEngine,
  resetMultiWarehouseSupportForTesting,
} from "../../multi-warehouse-support/index.js";
import {
  createSupplierRiskMonitorEngine,
  resetSupplierRiskMonitorForTesting,
} from "../../supplier-risk-monitor/index.js";
import {
  createLogisticsOptimizationEngine,
  resetLogisticsOptimizationForTesting,
} from "../../logistics-optimization/index.js";
import {
  createFulfilmentSlaMonitorEngine,
  resetFulfilmentSlaMonitorForTesting,
} from "../../fulfilment-sla-monitor/index.js";
import {
  createProcurementIntelligenceEngine,
  resetProcurementIntelligenceForTesting,
  buildProcurementIntelligenceConfiguration,
  PROCUREMENT_INTELLIGENCE_SYSTEM_PATH,
  PI_METADATA_VERSION,
  PI_SUPPORTED_SUPPLIER_IDENTIFIERS,
} from "../../procurement-intelligence/index.js";
import { appendPiLog, getPiLogs } from "../../procurement-intelligence/pi-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildProcurementIntelligenceConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const sf = createSupplierFrameworkEngine(bootstrap);
  await sf.initialize();
  const cj = createCjDropshippingIntegrationEngine(bootstrap, sf);
  await cj.initialize();
  const aliexpress = createAliExpressIntegrationEngine(bootstrap, sf);
  await aliexpress.initialize();
  const oss1688 = createOss1688IntegrationEngine(bootstrap, sf);
  await oss1688.initialize();
  const productSync = createSupplierProductSyncEngine(bootstrap, cj, aliexpress, oss1688, sf);
  await productSync.initialize();
  await productSync.syncSupplierProducts({ includeFixtureCatalog: true });
  const inventorySync = createSupplierInventorySyncEngine(bootstrap, productSync);
  await inventorySync.initialize();
  await inventorySync.syncSupplierInventory({ includeFixtureInventory: true });
  const pricingEngine = createSupplierPricingEngine(bootstrap, productSync, inventorySync);
  await pricingEngine.initialize();
  await pricingEngine.syncSupplierPricing({ includeFixturePricing: true });
  const rankingEngine = createSupplierRankingEngine(bootstrap, productSync, inventorySync, pricingEngine);
  await rankingEngine.initialize();
  await rankingEngine.rankSuppliers({ includeFixtureMetrics: false });
  const procurementEngine = createProcurementEngine(
    bootstrap,
    productSync,
    inventorySync,
    pricingEngine,
    rankingEngine,
  );
  await procurementEngine.initialize();
  const fulfilmentOrchestrator = createFulfilmentOrchestrator(bootstrap, procurementEngine);
  await fulfilmentOrchestrator.initialize();
  const carrierIntegration = createShippingCarrierIntegrationEngine(bootstrap, fulfilmentOrchestrator);
  await carrierIntegration.initialize();
  const shipmentTracking = createShipmentTrackingEngine(bootstrap, carrierIntegration);
  await shipmentTracking.initialize();
  const returnManagement = createReturnManagementEngine(bootstrap, shipmentTracking);
  await returnManagement.initialize();
  const warehouseIntelligence = createWarehouseIntelligenceEngine(
    bootstrap,
    inventorySync,
    fulfilmentOrchestrator,
    shipmentTracking,
  );
  await warehouseIntelligence.initialize();
  const multiWarehouseSupport = createMultiWarehouseSupportEngine(bootstrap, warehouseIntelligence);
  await multiWarehouseSupport.initialize();
  const supplierRiskMonitor = createSupplierRiskMonitorEngine(
    bootstrap,
    rankingEngine,
    procurementEngine,
    inventorySync,
    multiWarehouseSupport,
  );
  await supplierRiskMonitor.initialize();
  const logisticsOptimization = createLogisticsOptimizationEngine(
    bootstrap,
    fulfilmentOrchestrator,
    carrierIntegration,
    shipmentTracking,
    multiWarehouseSupport,
  );
  await logisticsOptimization.initialize();
  const fulfilmentSlaMonitor = createFulfilmentSlaMonitorEngine(
    bootstrap,
    fulfilmentOrchestrator,
    shipmentTracking,
    logisticsOptimization,
  );
  await fulfilmentSlaMonitor.initialize();
  const engine = createProcurementIntelligenceEngine(
    bootstrap,
    procurementEngine,
    rankingEngine,
    pricingEngine,
    supplierRiskMonitor,
    logisticsOptimization,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, procurementEngine };
}

describe("R2-19 Procurement Intelligence", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
    resetAliExpressIntegrationForTesting();
    resetOss1688IntegrationForTesting();
    resetSupplierProductSyncForTesting();
    resetSupplierInventorySyncForTesting();
    resetSupplierPricingEngineForTesting();
    resetSupplierRankingEngineForTesting();
    resetProcurementEngineForTesting();
    resetFulfilmentOrchestratorForTesting();
    resetShippingCarrierIntegrationForTesting();
    resetShipmentTrackingEngineForTesting();
    resetReturnManagementForTesting();
    resetWarehouseIntelligenceForTesting();
    resetMultiWarehouseSupportForTesting();
    resetSupplierRiskMonitorForTesting();
    resetLogisticsOptimizationForTesting();
    resetFulfilmentSlaMonitorForTesting();
    resetProcurementIntelligenceForTesting();
  });

  test("buildProcurementIntelligenceConfiguration loads defaults", () => {
    const config = buildProcurementIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.supplierEvaluationRulesEnabled, true);
    assert.equal(config.confidenceThreshold, 60);
  });

  test("procurement intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PI-001");
    assert.equal(state.missionId, "R2-19");
    assert.ok(PROCUREMENT_INTELLIGENCE_SYSTEM_PATH.includes("PROCUREMENT_INTELLIGENCE"));
    assert.equal(state.status, "active");
  });

  test("analyzeProcurement analyzes procurement from upstream data", async () => {
    const { engine, procurementEngine } = await buildEngine();
    procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 5,
    });
    const report = engine.analyzeProcurement();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.records.length >= 1);
  });

  test("analyzeProcurement produces machine-readable pi-* intelligence records", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({ includeFixtureProcurements: true });
    const record = report.records[0]!;
    assert.ok(record.procurementIntelligenceId.startsWith("pi-"));
    assert.ok(report.intelligenceReportId.startsWith("pi-run-"));
    assert.equal(record.metadataVersion, PI_METADATA_VERSION);
    assert.ok(PI_SUPPORTED_SUPPLIER_IDENTIFIERS.includes(record.recommendedSupplier as typeof PI_SUPPORTED_SUPPLIER_IDENTIFIERS[number]));
  });

  test("supplier recommendations and purchasing timing are generated", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({
      includeFixtureProcurements: true,
      intelligenceFixtureMode: "optimal",
    });
    assert.ok(report.records.every((r) => r.recommendedPurchaseQuantity > 0));
    assert.ok(report.records.every((r) => r.recommendedPurchaseTiming.length > 0));
    assert.ok(report.records.some((r) => r.procurementConfidenceScore >= 60));
  });

  test("procurement costs are optimized with confidence scores", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({
      includeFixtureProcurements: true,
      intelligenceFixtureMode: "optimal",
    });
    assert.ok(report.records.every((r) => r.estimatedProcurementCost >= 0));
    assert.ok(report.records.every((r) => r.procurementConfidenceScore >= 0 && r.procurementConfidenceScore <= 100));
    assert.ok(report.records.some((r) => r.estimatedProcurementCost < 150));
  });

  test("procurement anomalies are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({
      includeFixtureProcurements: true,
      intelligenceFixtureMode: "anomaly",
    });
    assert.ok(report.anomalies.length > 0);
    assert.ok(report.records.some((r) => r.procurementConfidenceScore < 70));
  });

  test("purchasing recommendations are generated", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({
      includeFixtureProcurements: true,
      intelligenceFixtureMode: "optimal",
    });
    assert.ok(report.recommendations.length > 0);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPiLog({
      event: "procurement_analysis",
      level: "info",
      details: "api_key=secret-pi-key bearer abc123 token=xyz",
    });
    engine.analyzeProcurement({ includeFixtureProcurements: true });
    const logs = getPiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-pi-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.analyzeProcurement({ includeFixtureProcurements: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.intelligenceRecordCount >= 1);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent analysis operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.analyzeProcurement({ includeFixtureProcurements: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.intelligenceReportId, report.intelligenceReportId);
  });
});
