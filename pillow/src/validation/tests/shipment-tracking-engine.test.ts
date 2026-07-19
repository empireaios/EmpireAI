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
  buildShipmentTrackingEngineConfiguration,
  SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH,
  STE_METADATA_VERSION,
} from "../../shipment-tracking-engine/index.js";
import { appendSteLog, getSteLogs } from "../../shipment-tracking-engine/ste-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildShipmentTrackingEngineConfiguration>[1],
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
  const engine = createShipmentTrackingEngine(bootstrap, carrierIntegration, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine };
}

async function seedShipment(
  carrierIntegration: Awaited<ReturnType<typeof buildEngine>>["carrierIntegration"],
  fulfilmentOrchestrator: Awaited<ReturnType<typeof buildEngine>>["fulfilmentOrchestrator"],
  procurementEngine: Awaited<ReturnType<typeof buildEngine>>["procurementEngine"],
) {
  const procurement = procurementEngine.createProcurementRequest({
    productReference: "cj-prod-1001",
    requestedQuantity: 1,
  });
  await fulfilmentOrchestrator.routeFulfilment({
    orderReference: "ord-track-seed",
    procurementReference: procurement.records[0]!.procurementId,
  });
  return carrierIntegration.createShipmentRequest({ includeFixtureShipment: false });
}

describe("R2-12 Shipment Tracking Engine", () => {
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
  });

  test("buildShipmentTrackingEngineConfiguration loads defaults", () => {
    const config = buildShipmentTrackingEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.carrierTrackingRulesEnabled, true);
    assert.equal(config.delayDetectionRulesEnabled, true);
  });

  test("shipment tracking engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-STE-001");
    assert.equal(state.missionId, "R2-12");
    assert.ok(SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH.includes("SHIPMENT_TRACKING"));
    assert.equal(state.status, "active");
  });

  test("syncShipmentTracking creates tracking records from carrier shipments", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, 1);
    assert.equal(report.records[0]!.currentShipmentStatus, "in_transit");
  });

  test("syncShipmentTracking produces machine-readable ste-* tracking records", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    const record = report.records[0]!;
    assert.ok(record.trackingRecordId.startsWith("ste-"));
    assert.ok(report.trackingReportId.startsWith("ste-run-"));
    assert.equal(record.metadataVersion, STE_METADATA_VERSION);
    assert.ok(record.trackingNumber.startsWith("TRK-"));
  });

  test("delivered shipments are detected", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "delivered" });
    const record = report.records[0]!;
    assert.equal(record.currentShipmentStatus, "delivered");
    assert.equal(record.deliveryMilestone, "delivered");
    assert.ok(record.deliveredTimestamp);
  });

  test("delayed shipments are detected", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "delayed" });
    const record = report.records[0]!;
    assert.equal(record.currentShipmentStatus, "delayed");
    assert.equal(record.delayStatus, "delayed");
  });

  test("failed deliveries are detected", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "failed" });
    const record = report.records[0]!;
    assert.equal(record.currentShipmentStatus, "failed");
    assert.equal(record.delayStatus, "at_risk");
  });

  test("receiveTrackingWebhook processes webhook events", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    const shipment = await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    engine.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    const shipmentId = shipment.records[0]!.shipmentId;
    const report = engine.receiveTrackingWebhook({
      shipmentId,
      trackingNumber: `TRK-FEDEX-${shipmentId.replace("sci-", "").slice(0, 12)}`,
      eventType: "out_for_delivery",
      location: "Local depot",
    });
    assert.equal(report.events.length, 1);
    assert.equal(report.events[0]!.source, "webhook");
    assert.equal(report.records[0]!.currentShipmentStatus, "out_for_delivery");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSteLog({
      event: "carrier_tracking_request",
      level: "info",
      details: "api_key=secret-ste-key bearer abc123 token=xyz",
    });
    engine.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    const logs = getSteLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-ste-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    engine.syncShipmentTracking({ trackingFixtureMode: "in_transit" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.trackingCount >= 1);
    assert.equal(cockpit.engineStatus, "active");
  });

  test("getLatestReport returns most recent tracking operation", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const report = engine.syncShipmentTracking({ trackingFixtureMode: "delivered" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.trackingReportId, report.trackingReportId);
  });

  test("queryCarrierTracking queries single shipment", async () => {
    const { engine, carrierIntegration, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    const shipment = await seedShipment(carrierIntegration, fulfilmentOrchestrator, procurementEngine);
    const shipmentId = shipment.records[0]!.shipmentId;
    const report = engine.queryCarrierTracking({ shipmentId });
    assert.equal(report.action, "sync");
    assert.equal(report.records.length, 1);
    assert.equal(report.records[0]!.shipmentId, shipmentId);
  });
});
