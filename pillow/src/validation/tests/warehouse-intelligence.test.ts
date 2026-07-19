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
  createWarehouseIntelligenceEngine,
  resetWarehouseIntelligenceForTesting,
  buildWarehouseIntelligenceConfiguration,
  WAREHOUSE_INTELLIGENCE_SYSTEM_PATH,
  WI_METADATA_VERSION,
  WAREHOUSE_IDENTIFIERS,
} from "../../warehouse-intelligence/index.js";
import { appendWiLog, getWiLogs } from "../../warehouse-intelligence/wi-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildWarehouseIntelligenceConfiguration>[1],
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
  const engine = createWarehouseIntelligenceEngine(
    bootstrap,
    inventorySync,
    fulfilmentOrchestrator,
    shipmentTracking,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, inventorySync, fulfilmentOrchestrator, shipmentTracking, procurementEngine };
}

describe("R2-14 Warehouse Intelligence", () => {
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
    resetWarehouseIntelligenceForTesting();
  });

  test("buildWarehouseIntelligenceConfiguration loads defaults", () => {
    const config = buildWarehouseIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.warehouseAllocationRulesEnabled, true);
    assert.equal(config.capacityThresholdPercent, 85);
  });

  test("warehouse intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-WI-001");
    assert.equal(state.missionId, "R2-14");
    assert.ok(WAREHOUSE_INTELLIGENCE_SYSTEM_PATH.includes("WAREHOUSE_INTELLIGENCE"));
    assert.equal(state.status, "active");
  });

  test("coordinateWarehouses creates warehouse records from upstream data", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, WAREHOUSE_IDENTIFIERS.length);
  });

  test("coordinateWarehouses produces machine-readable wi-* warehouse records", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    const record = report.records[0]!;
    assert.ok(record.warehouseRecordId.startsWith("wi-"));
    assert.ok(report.warehouseReportId.startsWith("wi-run-"));
    assert.equal(record.metadataVersion, WI_METADATA_VERSION);
    assert.ok(WAREHOUSE_IDENTIFIERS.includes(record.warehouseId));
  });

  test("warehouse bottlenecks are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({
      includeFixtureWarehouses: true,
      warehouseFixtureMode: "bottleneck",
    });
    assert.ok(report.records.some((r) => r.warehouseStatus === "bottleneck"));
  });

  test("warehouse shortages are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({
      includeFixtureWarehouses: true,
      warehouseFixtureMode: "shortage",
    });
    assert.ok(report.records.some((r) => r.warehouseStatus === "shortage"));
  });

  test("warehouse overstock conditions are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({
      includeFixtureWarehouses: true,
      warehouseFixtureMode: "overstock",
    });
    assert.ok(report.records.some((r) => r.warehouseStatus === "overstock"));
  });

  test("allocateWarehouse selects optimal warehouse location", async () => {
    const { engine } = await buildEngine();
    engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    const report = engine.allocateWarehouse({
      orderReference: "ord-wh-alloc",
      productReference: "cj-prod-1001",
      quantity: 1,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.records.length >= 1);
  });

  test("optimizeInventoryDistribution optimizes warehouse inventory", async () => {
    const { engine } = await buildEngine();
    engine.coordinateWarehouses({ includeFixtureWarehouses: true, warehouseFixtureMode: "overstock" });
    const before = engine.getRecords();
    const report = engine.optimizeInventoryDistribution({});
    assert.equal(report.action, "optimize");
    const after = report.records;
    assert.ok(after.length > 0);
    assert.ok(
      after.some((r, i) => r.inventoryLevel !== before[i]?.inventoryLevel) ||
        after.some((r) => r.warehouseStatus === "optimal"),
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendWiLog({
      event: "warehouse_allocation",
      level: "info",
      details: "api_key=secret-wi-key bearer abc123 token=xyz",
    });
    engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    const logs = getWiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-wi-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.warehouseCount >= WAREHOUSE_IDENTIFIERS.length);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent warehouse operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.coordinateWarehouses({ includeFixtureWarehouses: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.warehouseReportId, report.warehouseReportId);
  });
});
