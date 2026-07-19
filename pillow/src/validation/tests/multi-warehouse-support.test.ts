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
  buildMultiWarehouseSupportConfiguration,
  MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH,
  MWS_METADATA_VERSION,
  MWS_WAREHOUSE_IDENTIFIERS,
} from "../../multi-warehouse-support/index.js";
import { appendMwsLog, getMwsLogs } from "../../multi-warehouse-support/mws-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMultiWarehouseSupportConfiguration>[1],
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
  const engine = createMultiWarehouseSupportEngine(bootstrap, warehouseIntelligence, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, warehouseIntelligence };
}

describe("R2-15 Multi-Warehouse Support", () => {
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
  });

  test("buildMultiWarehouseSupportConfiguration loads defaults", () => {
    const config = buildMultiWarehouseSupportConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.warehouseRegistrationRulesEnabled, true);
    assert.equal(config.inventoryTransferRulesEnabled, true);
  });

  test("multi-warehouse support initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MWS-001");
    assert.equal(state.missionId, "R2-15");
    assert.ok(MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH.includes("MULTI_WAREHOUSE"));
    assert.equal(state.status, "active");
  });

  test("registerWarehouses registers multiple warehouse locations", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerWarehouses({ includeFixtureWarehouses: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, MWS_WAREHOUSE_IDENTIFIERS.length);
  });

  test("registerWarehouses produces machine-readable mws-* network records", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerWarehouses({ includeFixtureWarehouses: true });
    const record = report.records[0]!;
    assert.ok(record.warehouseNetworkId.startsWith("mws-"));
    assert.ok(report.networkReportId.startsWith("mws-run-"));
    assert.equal(record.metadataVersion, MWS_METADATA_VERSION);
    assert.ok(MWS_WAREHOUSE_IDENTIFIERS.includes(record.warehouseId));
  });

  test("warehouse imbalance is detected across network", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerWarehouses({
      includeFixtureWarehouses: true,
      networkFixtureMode: "imbalanced",
    });
    assert.ok(report.records.some((r) => r.warehouseHealthStatus === "imbalanced"));
  });

  test("warehouse capacity issues are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerWarehouses({
      includeFixtureWarehouses: true,
      networkFixtureMode: "capacity_issue",
    });
    assert.ok(report.records.some((r) => r.warehouseHealthStatus === "capacity_issue"));
  });

  test("selectWarehouse selects optimal warehouse location", async () => {
    const { engine } = await buildEngine();
    engine.registerWarehouses({ includeFixtureWarehouses: true });
    const report = engine.selectWarehouse({
      orderReference: "ord-mws-select",
      productReference: "cj-prod-1001",
      quantity: 1,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.records.length, 1);
  });

  test("transferInventory supports inventory transfers between warehouses", async () => {
    const { engine } = await buildEngine();
    engine.registerWarehouses({ includeFixtureWarehouses: true, networkFixtureMode: "balanced" });
    const report = engine.transferInventory({
      sourceWarehouseId: "wh-east",
      targetWarehouseId: "wh-west",
      quantity: 100,
      transferFixtureMode: "completed",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.records.some((r) => r.inventoryTransferStatus === "completed"));
  });

  test("routeFulfilmentBetweenWarehouses routes fulfilment across network", async () => {
    const { engine } = await buildEngine();
    engine.registerWarehouses({ includeFixtureWarehouses: true });
    const report = engine.routeFulfilmentBetweenWarehouses({
      orderReference: "ord-mws-route",
      targetWarehouseId: "wh-central",
    });
    assert.equal(report.action, "route");
    assert.equal(report.records.length, 1);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMwsLog({
      event: "warehouse_registration",
      level: "info",
      details: "api_key=secret-mws-key bearer abc123 token=xyz",
    });
    engine.registerWarehouses({ includeFixtureWarehouses: true });
    const logs = getMwsLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-mws-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.registerWarehouses({ includeFixtureWarehouses: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.warehouseCount >= MWS_WAREHOUSE_IDENTIFIERS.length);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent network operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerWarehouses({ includeFixtureWarehouses: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.networkReportId, report.networkReportId);
  });
});
