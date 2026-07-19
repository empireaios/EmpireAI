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
  buildReturnManagementConfiguration,
  RETURN_MANAGEMENT_SYSTEM_PATH,
  RM_METADATA_VERSION,
} from "../../return-management/index.js";
import { appendRmLog, getRmLogs } from "../../return-management/rm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildReturnManagementConfiguration>[1],
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
  const engine = createReturnManagementEngine(bootstrap, shipmentTracking, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, shipmentTracking, carrierIntegration, fulfilmentOrchestrator, procurementEngine };
}

async function seedDeliveredShipment(
  shipmentTracking: Awaited<ReturnType<typeof buildEngine>>["shipmentTracking"],
  carrierIntegration: Awaited<ReturnType<typeof buildEngine>>["carrierIntegration"],
  fulfilmentOrchestrator: Awaited<ReturnType<typeof buildEngine>>["fulfilmentOrchestrator"],
  procurementEngine: Awaited<ReturnType<typeof buildEngine>>["procurementEngine"],
) {
  const procurement = procurementEngine.createProcurementRequest({
    productReference: "cj-prod-1001",
    requestedQuantity: 1,
  });
  await fulfilmentOrchestrator.routeFulfilment({
    orderReference: "ord-return-seed",
    procurementReference: procurement.records[0]!.procurementId,
  });
  await carrierIntegration.createShipmentRequest({ includeFixtureShipment: false });
  return shipmentTracking.syncShipmentTracking({ trackingFixtureMode: "delivered" });
}

describe("R2-13 Return Management", () => {
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
  });

  test("buildReturnManagementConfiguration loads defaults", () => {
    const config = buildReturnManagementConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.returnEligibilityRulesEnabled, true);
    assert.equal(config.supplierReturnRulesEnabled, true);
  });

  test("return management initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RM-001");
    assert.equal(state.missionId, "R2-13");
    assert.ok(RETURN_MANAGEMENT_SYSTEM_PATH.includes("RETURN_MANAGEMENT"));
    assert.equal(state.status, "active");
  });

  test("createReturnRequest creates return from delivered shipment", async () => {
    const { engine, shipmentTracking, carrierIntegration, fulfilmentOrchestrator, procurementEngine } =
      await buildEngine();
    await seedDeliveredShipment(
      shipmentTracking,
      carrierIntegration,
      fulfilmentOrchestrator,
      procurementEngine,
    );
    const report = engine.createReturnRequest({ returnReason: "defective" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, 1);
    assert.equal(report.records[0]!.returnAuthorizationStatus, "authorized");
  });

  test("createReturnRequest produces machine-readable rm-* return records", async () => {
    const { engine } = await buildEngine();
    const report = engine.createReturnRequest({ includeFixtureReturn: true });
    const record = report.records[0]!;
    assert.ok(record.returnId.startsWith("rm-"));
    assert.ok(report.returnReportId.startsWith("rm-run-"));
    assert.equal(record.metadataVersion, RM_METADATA_VERSION);
    assert.ok(record.returnLabelReference?.startsWith("rm-label-"));
  });

  test("return eligibility is validated for undelivered shipments", async () => {
    const { engine, shipmentTracking, carrierIntegration, fulfilmentOrchestrator, procurementEngine } =
      await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    await fulfilmentOrchestrator.routeFulfilment({
      orderReference: "ord-return-ineligible",
      procurementReference: procurement.records[0]!.procurementId,
    });
    await carrierIntegration.createShipmentRequest({ includeFixtureShipment: false });
    await shipmentTracking.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    const report = engine.createReturnRequest({});
    assert.ok(report.invalidRecords.length > 0 || report.failures.length > 0);
  });

  test("return shipping labels are generated", async () => {
    const { engine } = await buildEngine();
    const report = engine.createReturnRequest({ includeFixtureReturn: true });
    const record = report.records[0]!;
    assert.ok(record.returnLabelReference?.startsWith("rm-label-"));
    assert.ok(record.returnTrackingNumber?.startsWith("RTRK-"));
    assert.equal(record.returnShipmentStatus, "label_generated");
  });

  test("receiveCustomerReturnRequest processes customer returns", async () => {
    const { engine, shipmentTracking, carrierIntegration, fulfilmentOrchestrator, procurementEngine } =
      await buildEngine();
    const tracking = await seedDeliveredShipment(
      shipmentTracking,
      carrierIntegration,
      fulfilmentOrchestrator,
      procurementEngine,
    );
    const shipmentId = tracking.records[0]!.shipmentId;
    const report = engine.receiveCustomerReturnRequest({
      orderReference: "ord-return-seed",
      customerReference: "cust-001",
      returnReason: "wrong_item",
      shipmentReference: shipmentId,
    });
    assert.equal(report.action, "customer_request");
    assert.equal(report.records[0]!.returnReason, "wrong_item");
  });

  test("trackReturnLifecycle tracks return to completion", async () => {
    const { engine } = await buildEngine();
    const created = engine.createReturnRequest({ includeFixtureReturn: true });
    const returnId = created.records[0]!.returnId;
    const report = engine.trackReturnLifecycle({ returnId, returnFixtureMode: "received" });
    assert.equal(report.records[0]!.returnCompletionStatus, "completed");
    assert.equal(report.records[0]!.inventoryRestocked, true);
  });

  test("return failures are detected", async () => {
    const { engine } = await buildEngine();
    const created = engine.createReturnRequest({ includeFixtureReturn: true });
    const returnId = created.records[0]!.returnId;
    const report = engine.trackReturnLifecycle({ returnId, returnFixtureMode: "failed" });
    assert.equal(report.records[0]!.returnCompletionStatus, "failed");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendRmLog({
      event: "return_authorization",
      level: "info",
      details: "api_key=secret-rm-key bearer abc123 token=xyz",
    });
    engine.createReturnRequest({ includeFixtureReturn: true });
    const logs = getRmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-rm-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.createReturnRequest({ includeFixtureReturn: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.returnCount >= 1);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent return operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.createReturnRequest({ includeFixtureReturn: true, returnReason: "other" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.returnReportId, report.returnReportId);
  });
});
