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
} from "../../logistics-optimization/index.js";
import {
  createFulfilmentSlaMonitorEngine,
  resetFulfilmentSlaMonitorForTesting,
  buildFulfilmentSlaMonitorConfiguration,
  FULFILMENT_SLA_MONITOR_SYSTEM_PATH,
  FSM_METADATA_VERSION,
  FSM_SUPPORTED_SUPPLIER_IDENTIFIERS,
} from "../../fulfilment-sla-monitor/index.js";
import { appendFsmLog, getFsmLogs } from "../../fulfilment-sla-monitor/fsm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildFulfilmentSlaMonitorConfiguration>[1],
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
  const logisticsOptimization = createLogisticsOptimizationEngine(
    bootstrap,
    fulfilmentOrchestrator,
    carrierIntegration,
    shipmentTracking,
    multiWarehouseSupport,
  );
  await logisticsOptimization.initialize();
  const engine = createFulfilmentSlaMonitorEngine(
    bootstrap,
    fulfilmentOrchestrator,
    shipmentTracking,
    logisticsOptimization,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, fulfilmentOrchestrator, carrierIntegration, procurementEngine, logisticsOptimization };
}

async function seedSlaOrder(
  fulfilmentOrchestrator: Awaited<ReturnType<typeof buildEngine>>["fulfilmentOrchestrator"],
  carrierIntegration: Awaited<ReturnType<typeof buildEngine>>["carrierIntegration"],
  procurementEngine: Awaited<ReturnType<typeof buildEngine>>["procurementEngine"],
  logisticsOptimization: Awaited<ReturnType<typeof buildEngine>>["logisticsOptimization"],
) {
  const procurement = procurementEngine.createProcurementRequest({
    productReference: "cj-prod-1001",
    requestedQuantity: 1,
  });
  await fulfilmentOrchestrator.routeFulfilment({
    orderReference: "ord-fsm-seed",
    procurementReference: procurement.records[0]!.procurementId,
  });
  await carrierIntegration.createShipmentRequest({ includeFixtureShipment: false });
  logisticsOptimization.optimizeShipping();
}

describe("R2-18 Fulfilment SLA Monitor", () => {
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
    resetFulfilmentSlaMonitorForTesting();
  });

  test("buildFulfilmentSlaMonitorConfiguration loads defaults", () => {
    const config = buildFulfilmentSlaMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.complianceRulesEnabled, true);
    assert.equal(config.slaThresholdHours, 72);
  });

  test("fulfilment SLA monitor initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FSM-001");
    assert.equal(state.missionId, "R2-18");
    assert.ok(FULFILMENT_SLA_MONITOR_SYSTEM_PATH.includes("FULFILMENT_SLA_MONITOR"));
    assert.equal(state.status, "active");
  });

  test("monitorFulfilmentSla monitors SLAs from upstream data", async () => {
    const { engine, fulfilmentOrchestrator, carrierIntegration, procurementEngine, logisticsOptimization } =
      await buildEngine();
    await seedSlaOrder(fulfilmentOrchestrator, carrierIntegration, procurementEngine, logisticsOptimization);
    const report = engine.monitorFulfilmentSla();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.records.length >= 1);
  });

  test("monitorFulfilmentSla produces machine-readable fsm-* SLA records", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({ includeFixtureOrders: true });
    const record = report.records[0]!;
    assert.ok(record.slaRecordId.startsWith("fsm-"));
    assert.ok(report.slaReportId.startsWith("fsm-run-"));
    assert.equal(record.metadataVersion, FSM_METADATA_VERSION);
    assert.ok(FSM_SUPPORTED_SUPPLIER_IDENTIFIERS.includes(record.supplierReference as typeof FSM_SUPPORTED_SUPPLIER_IDENTIFIERS[number]));
  });

  test("SLA compliance scores are calculated", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({
      includeFixtureOrders: true,
      slaFixtureMode: "compliant",
    });
    assert.ok(report.records.every((r) => r.complianceScore >= 0 && r.complianceScore <= 100));
    assert.ok(report.records.some((r) => r.complianceStatus === "compliant"));
  });

  test("SLA breaches are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({
      includeFixtureOrders: true,
      slaFixtureMode: "breached",
    });
    assert.ok(report.records.some((r) => r.complianceStatus === "breached"));
    assert.ok(report.records.some((r) => r.activeAlerts.includes("fulfilment_breach")));
  });

  test("SLA risks are detected and alerts generated", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({
      includeFixtureOrders: true,
      slaFixtureMode: "at_risk",
    });
    assert.ok(report.records.some((r) => r.complianceStatus === "at_risk"));
    assert.ok(report.records.some((r) => r.activeAlerts.includes("sla_risk")));
  });

  test("SLA history is tracked", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({ includeFixtureOrders: true });
    assert.ok(report.history.length >= report.records.length);
    const history = engine.getHistory();
    assert.ok(history.length >= 1);
    assert.ok(history[0]!.historyId.startsWith("fsm-hist-"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendFsmLog({
      event: "sla_monitoring",
      level: "info",
      details: "api_key=secret-fsm-key bearer abc123 tracking_number=1Z999",
    });
    engine.monitorFulfilmentSla({ includeFixtureOrders: true });
    const logs = getFsmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-fsm-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.monitorFulfilmentSla({ includeFixtureOrders: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.slaRecordCount >= 1);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent monitoring operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorFulfilmentSla({ includeFixtureOrders: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.slaReportId, report.slaReportId);
  });
});
