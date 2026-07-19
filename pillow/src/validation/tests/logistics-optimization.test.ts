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
  createLogisticsOptimizationEngine,
  resetLogisticsOptimizationForTesting,
  buildLogisticsOptimizationConfiguration,
  LOGISTICS_OPTIMIZATION_SYSTEM_PATH,
  LO_METADATA_VERSION,
  LO_SUPPORTED_CARRIER_IDENTIFIERS,
} from "../../logistics-optimization/index.js";
import { appendLoLog, getLoLogs } from "../../logistics-optimization/lo-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildLogisticsOptimizationConfiguration>[1],
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
  await multiWarehouseSupport.registerWarehouses({ includeFixtureWarehouses: true });
  const engine = createLogisticsOptimizationEngine(
    bootstrap,
    fulfilmentOrchestrator,
    carrierIntegration,
    shipmentTracking,
    multiWarehouseSupport,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, fulfilmentOrchestrator, carrierIntegration, procurementEngine };
}

async function seedLogisticsOrder(
  fulfilmentOrchestrator: Awaited<ReturnType<typeof buildEngine>>["fulfilmentOrchestrator"],
  carrierIntegration: Awaited<ReturnType<typeof buildEngine>>["carrierIntegration"],
  procurementEngine: Awaited<ReturnType<typeof buildEngine>>["procurementEngine"],
) {
  const procurement = procurementEngine.createProcurementRequest({
    productReference: "cj-prod-1001",
    requestedQuantity: 1,
  });
  await fulfilmentOrchestrator.routeFulfilment({
    orderReference: "ord-lo-seed",
    procurementReference: procurement.records[0]!.procurementId,
  });
  return carrierIntegration.createShipmentRequest({ includeFixtureShipment: false });
}

describe("R2-17 Logistics Optimization", () => {
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
    resetLogisticsOptimizationForTesting();
  });

  test("buildLogisticsOptimizationConfiguration loads defaults", () => {
    const config = buildLogisticsOptimizationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.routeOptimizationRulesEnabled, true);
    assert.equal(config.costOptimizationThreshold, 15);
  });

  test("logistics optimization initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-LO-001");
    assert.equal(state.missionId, "R2-17");
    assert.ok(LOGISTICS_OPTIMIZATION_SYSTEM_PATH.includes("LOGISTICS_OPTIMIZATION"));
    assert.equal(state.status, "active");
  });

  test("optimizeShipping optimizes logistics from upstream data", async () => {
    const { engine, fulfilmentOrchestrator, carrierIntegration, procurementEngine } = await buildEngine();
    await seedLogisticsOrder(fulfilmentOrchestrator, carrierIntegration, procurementEngine);
    const report = engine.optimizeShipping();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.records.length >= 1);
  });

  test("optimizeShipping produces machine-readable lo-* logistics records", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({ includeFixtureOrders: true });
    const record = report.records[0]!;
    assert.ok(record.logisticsRecordId.startsWith("lo-"));
    assert.ok(report.logisticsReportId.startsWith("lo-run-"));
    assert.equal(record.metadataVersion, LO_METADATA_VERSION);
    assert.ok(LO_SUPPORTED_CARRIER_IDENTIFIERS.includes(record.carrierReference));
  });

  test("carrier selection and warehouse selection function correctly", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({
      includeFixtureOrders: true,
      logisticsFixtureMode: "optimal",
    });
    assert.ok(report.records.every((r) => r.carrierReference.length > 0));
    assert.ok(report.records.every((r) => r.warehouseReference.startsWith("wh-")));
    assert.ok(report.records.some((r) => r.selectedRoute === "optimized_route"));
  });

  test("shipping costs are optimized and delivery times calculated", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({
      includeFixtureOrders: true,
      logisticsFixtureMode: "optimal",
    });
    assert.ok(report.records.every((r) => r.estimatedShippingCost >= 0));
    assert.ok(report.records.every((r) => r.estimatedDeliveryTime >= 1));
    assert.ok(report.records.every((r) => r.optimizationScore >= 0 && r.optimizationScore <= 100));
    assert.ok(report.records.some((r) => r.estimatedShippingCost < 15));
  });

  test("logistics bottlenecks are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({
      includeFixtureOrders: true,
      logisticsFixtureMode: "bottleneck",
    });
    assert.ok(report.bottlenecks.length > 0);
    assert.ok(report.records.some((r) => r.optimizationScore < 60));
  });

  test("inefficient shipping routes are detected with recommendations", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({
      includeFixtureOrders: true,
      logisticsFixtureMode: "inefficient",
    });
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.recommendations.some((r) => r.improvementType === "reroute_warehouse"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendLoLog({
      event: "carrier_selection",
      level: "info",
      details: "api_key=secret-lo-key bearer abc123 tracking_number=1Z999",
    });
    engine.optimizeShipping({ includeFixtureOrders: true });
    const logs = getLoLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-lo-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.optimizeShipping({ includeFixtureOrders: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.logisticsRecordCount >= 1);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent optimization operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.optimizeShipping({ includeFixtureOrders: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.logisticsReportId, report.logisticsReportId);
  });
});
