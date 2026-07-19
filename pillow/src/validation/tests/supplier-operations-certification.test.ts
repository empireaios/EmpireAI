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
} from "../../procurement-intelligence/index.js";
import {
  createSupplierOperationsCertificationEngine,
  resetSupplierOperationsCertificationForTesting,
  buildSupplierOperationsCertificationConfiguration,
  SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_MISSIONS,
  SOC_METADATA_VERSION,
} from "../../supplier-operations-certification/index.js";
import {
  appendCertificationLog,
  getCertificationLogs,
} from "../../supplier-operations-certification/soc-logging.js";

async function buildFullSupplierStack(
  configOverrides?: Parameters<typeof buildSupplierOperationsCertificationConfiguration>[1],
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
  const procurementIntelligence = createProcurementIntelligenceEngine(
    bootstrap,
    procurementEngine,
    rankingEngine,
    pricingEngine,
    supplierRiskMonitor,
    logisticsOptimization,
  );
  await procurementIntelligence.initialize();

  const certification = createSupplierOperationsCertificationEngine(
    bootstrap,
    {
      supplierFramework: sf,
      cjDropshipping: cj,
      aliExpress: aliexpress,
      oss1688,
      supplierProductSync: productSync,
      supplierInventorySync: inventorySync,
      supplierPricing: pricingEngine,
      supplierRanking: rankingEngine,
      procurement: procurementEngine,
      fulfilmentOrchestrator,
      shippingCarrier: carrierIntegration,
      shipmentTracking,
      returnManagement,
      warehouseIntelligence,
      multiWarehouseSupport,
      supplierRiskMonitor,
      logisticsOptimization,
      fulfilmentSlaMonitor,
      procurementIntelligence,
    },
    { configuration: configOverrides },
  );
  await certification.initialize();

  return { certification, sf, procurementEngine, productSync, inventorySync };
}

describe("R2-20 Supplier Operations Certification", () => {
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
    resetSupplierOperationsCertificationForTesting();
  });

  test("buildSupplierOperationsCertificationConfiguration loads defaults", () => {
    const config = buildSupplierOperationsCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.certificationScope, "full");
    assert.equal(config.passThresholdPercent, 85);
    assert.equal(config.includeSmokeTests, true);
    assert.equal(config.safeTestMode, true);
  });

  test("supplier operations certification initializes with doctrine doc", async () => {
    const { certification } = await buildFullSupplierStack();
    const state = certification.getState();
    assert.equal(state.engineVersion, "PILLOW-SOC-001");
    assert.equal(state.missionId, "R2-20");
    assert.ok(SUPPLIER_OPERATIONS_CERTIFICATION_SYSTEM_PATH.includes("SUPPLIER_OPERATIONS"));
  });

  test("runSupplierCertification validates all R2-01 through R2-19 missions", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification({ includeSmokeTests: true });
    assert.equal(report.missionResults.length, CERTIFIED_MISSIONS.length);
    assert.equal(report.certifiedMissionList.length, CERTIFIED_MISSIONS.length);
    assert.ok(
      ["certified", "partial"].includes(report.overallCertificationStatus),
      report.detectedFailures.join("; "),
    );
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
  });

  test("runSupplierCertification produces machine-readable soc-run-* certification reports", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification();
    assert.ok(report.certificationId.startsWith("soc-run-"));
    assert.equal(report.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.equal(report.metadataVersion, SOC_METADATA_VERSION);
    assert.equal(report.certifiedPhase, "Supplier & Fulfilment");
  });

  test("supplier framework and connector missions are certified", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification({ includeSmokeTests: true });
    const connectorMissions = report.missionResults.filter((r) =>
      ["R2-01", "R2-02", "R2-03", "R2-04"].includes(r.missionId),
    );
    assert.equal(connectorMissions.length, 4);
    assert.ok(
      connectorMissions.every((m) => m.status !== "fail"),
      report.detectedFailures.join("; "),
    );
    assert.ok(report.certifiedSupplierModules.length >= 4);
  });

  test("procurement and fulfilment certification statuses are reported", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification({ includeSmokeTests: true });
    assert.ok(["certified", "partial"].includes(report.certifiedProcurementStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedFulfilmentStatus));
    const procurementMissions = report.missionResults.filter((r) =>
      ["R2-07", "R2-08", "R2-09", "R2-19"].includes(r.missionId),
    );
    assert.equal(procurementMissions.length, 4);
    const fulfilmentMissions = report.missionResults.filter((r) =>
      ["R2-10", "R2-11", "R2-12", "R2-13"].includes(r.missionId),
    );
    assert.equal(fulfilmentMissions.length, 4);
  });

  test("warehouse and logistics certification statuses are reported", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification({ includeSmokeTests: true });
    assert.ok(["certified", "partial"].includes(report.certifiedWarehouseStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedLogisticsStatus));
    assert.ok(["pass", "partial"].includes(report.endToEndValidationResult));
  });

  test("governance safety redacts sensitive values in certification logs", async () => {
    const { certification } = await buildFullSupplierStack();
    appendCertificationLog({
      event: "certification_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 token=xyz",
    });
    await certification.runSupplierCertification();
    const logs = getCertificationLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateLatestReport and cockpit snapshot report readiness", async () => {
    const { certification } = await buildFullSupplierStack();
    await certification.runSupplierCertification();
    const validation = certification.validateLatestReport();
    assert.notEqual(validation.decision, "fail", validation.errors.join("; "));
    const sync = certification.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 40);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = certification.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    const latest = certification.getLatestReport();
    assert.ok((latest?.missionResults.filter((r) => r.status === "pass").length ?? 0) >= 17);
  });

  test("getLatestReport returns most recent certification operation", async () => {
    const { certification } = await buildFullSupplierStack();
    const report = await certification.runSupplierCertification();
    const latest = certification.getLatestReport();
    assert.equal(latest?.certificationId, report.certificationId);
  });

  test("certification scope filters missions when configured", async () => {
    const { certification } = await buildFullSupplierStack({
      certificationScope: "sync",
    });
    const report = await certification.runSupplierCertification();
    assert.equal(report.missionResults.length, 2);
    assert.ok(report.missionResults.every((r) => ["R2-05", "R2-06"].includes(r.missionId)));
  });
});
