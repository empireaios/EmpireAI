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
  buildSupplierRiskMonitorConfiguration,
  SUPPLIER_RISK_MONITOR_SYSTEM_PATH,
  SRM_METADATA_VERSION,
  SRM_SUPPORTED_SUPPLIER_IDENTIFIERS,
} from "../../supplier-risk-monitor/index.js";
import { appendSrmLog, getSrmLogs } from "../../supplier-risk-monitor/srm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSupplierRiskMonitorConfiguration>[1],
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
  const engine = createSupplierRiskMonitorEngine(
    bootstrap,
    rankingEngine,
    procurementEngine,
    inventorySync,
    multiWarehouseSupport,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, rankingEngine };
}

describe("R2-16 Supplier Risk Monitor", () => {
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
  });

  test("buildSupplierRiskMonitorConfiguration loads defaults", () => {
    const config = buildSupplierRiskMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.alertRulesEnabled, true);
    assert.equal(config.riskThresholdScore, 50);
  });

  test("supplier risk monitor initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SRM-001");
    assert.equal(state.missionId, "R2-16");
    assert.ok(SUPPLIER_RISK_MONITOR_SYSTEM_PATH.includes("SUPPLIER_RISK"));
    assert.equal(state.status, "active");
  });

  test("monitorSupplierHealth monitors suppliers from upstream data", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, SRM_SUPPORTED_SUPPLIER_IDENTIFIERS.length);
  });

  test("monitorSupplierHealth produces machine-readable srm-* risk records", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    const record = report.records[0]!;
    assert.ok(record.supplierRiskId.startsWith("srm-"));
    assert.ok(report.riskReportId.startsWith("srm-run-"));
    assert.equal(record.metadataVersion, SRM_METADATA_VERSION);
    assert.ok(SRM_SUPPORTED_SUPPLIER_IDENTIFIERS.includes(record.supplierId));
  });

  test("supplier risk scores are calculated", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    assert.ok(report.records.every((r) => r.riskScore >= 0 && r.riskScore <= 100));
    assert.ok(report.records.every((r) => r.supplierHealthScore >= 0 && r.supplierHealthScore <= 100));
  });

  test("supplier disruptions are detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({
      includeFixtureSuppliers: true,
      riskFixtureMode: "disrupted",
    });
    assert.ok(
      report.records.some(
        (r) => r.availabilityStatus === "disrupted" || r.availabilityStatus === "unavailable",
      ),
    );
    assert.ok(report.records.some((r) => r.activeRiskAlerts.includes("disruption")));
  });

  test("abnormal supplier behaviour is detected", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({
      includeFixtureSuppliers: true,
      riskFixtureMode: "abnormal",
    });
    assert.ok(report.records.some((r) => r.activeRiskAlerts.includes("abnormal_behaviour")));
  });

  test("supplier risk alerts are generated", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({
      includeFixtureSuppliers: true,
      riskFixtureMode: "elevated",
    });
    assert.ok(report.records.some((r) => r.activeRiskAlerts.length > 0));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSrmLog({
      event: "supplier_health_check",
      level: "info",
      details: "api_key=secret-srm-key bearer abc123 token=xyz",
    });
    engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    const logs = getSrmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-srm-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.supplierCount >= SRM_SUPPORTED_SUPPLIER_IDENTIFIERS.length);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent monitoring operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.monitorSupplierHealth({ includeFixtureSuppliers: true });
    const latest = engine.getLatestReport();
    assert.equal(latest?.riskReportId, report.riskReportId);
  });
});
