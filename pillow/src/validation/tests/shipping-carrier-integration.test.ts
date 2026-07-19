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
  buildShippingCarrierIntegrationConfiguration,
  SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH,
  SCI_METADATA_VERSION,
  SUPPORTED_CARRIER_IDENTIFIERS,
} from "../../shipping-carrier-integration/index.js";
import { appendSciLog, getSciLogs } from "../../shipping-carrier-integration/sci-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildShippingCarrierIntegrationConfiguration>[1],
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
  const engine = createShippingCarrierIntegrationEngine(bootstrap, fulfilmentOrchestrator, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, fulfilmentOrchestrator, procurementEngine };
}

async function seedFulfilment(procurementEngine: Awaited<ReturnType<typeof buildEngine>>["procurementEngine"], fulfilmentOrchestrator: Awaited<ReturnType<typeof buildEngine>>["fulfilmentOrchestrator"]) {
  const procurement = procurementEngine.createProcurementRequest({
    productReference: "cj-prod-1001",
    requestedQuantity: 1,
  });
  return fulfilmentOrchestrator.routeFulfilment({
    orderReference: "ord-ship-seed",
    procurementReference: procurement.records[0]!.procurementId,
  });
}

describe("R2-11 Shipping Carrier Integration", () => {
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
  });

  test("buildShippingCarrierIntegrationConfiguration loads defaults", () => {
    const config = buildShippingCarrierIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.carrierRegistrationRulesEnabled, true);
    assert.equal(config.authenticationRulesEnabled, true);
  });

  test("shipping carrier integration initializes with doctrine doc and registers carriers", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SCI-001");
    assert.equal(state.missionId, "R2-11");
    assert.ok(SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH.includes("SHIPPING_CARRIER"));
    assert.equal(state.carriers.length, SUPPORTED_CARRIER_IDENTIFIERS.length);
    assert.ok(state.carriers.every((c) => c.authenticated));
  });

  test("registerCarriers registers supported shipping carriers", async () => {
    const { engine } = await buildEngine();
    const report = engine.registerCarriers({ carrierId: "ups" });
    assert.notEqual(report.validation.decision, "fail");
    const ups = engine.getCarriers().find((c) => c.carrierId === "ups");
    assert.ok(ups);
    assert.equal(ups!.carrierName, "United Parcel Service");
  });

  test("createShipmentRequest creates shipment from fulfilled order", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    const report = engine.createShipmentRequest({ includeFixtureShipment: false });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, 1);
  });

  test("createShipmentRequest produces machine-readable sci-* shipment records", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    const report = engine.createShipmentRequest({ includeFixtureShipment: false });
    const record = report.records[0]!;
    assert.ok(record.shipmentId.startsWith("sci-"));
    assert.ok(report.shipmentReportId.startsWith("sci-run-"));
    assert.equal(record.metadataVersion, SCI_METADATA_VERSION);
    assert.ok(record.shipmentRequestId.startsWith("sci-req-"));
  });

  test("shipping labels are generated with shipment requests", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    const report = engine.createShipmentRequest({ includeFixtureShipment: false });
    const record = report.records[0]!;
    assert.ok(record.shippingLabelReference?.startsWith("sci-label-"));
    assert.equal(record.shipmentStatus, "confirmed");
  });

  test("requestShippingRates returns quotes for carriers", async () => {
    const { engine } = await buildEngine();
    const report = engine.requestShippingRates({});
    assert.equal(report.rates.length, SUPPORTED_CARRIER_IDENTIFIERS.length);
    assert.ok(report.rates.every((r) => r.rate > 0));
  });

  test("carrier is mapped from fulfilment route intelligently", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    const report = engine.createShipmentRequest({ includeFixtureShipment: false });
    assert.equal(report.records[0]!.carrierId, "fedex");
  });

  test("requestShippingLabel generates label for existing shipment", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    const created = engine.createShipmentRequest({ includeFixtureShipment: false });
    const shipmentId = created.records[0]!.shipmentId;
    const labelReport = engine.requestShippingLabel({ shipmentId });
    assert.ok(labelReport.records[0]!.shippingLabelReference?.startsWith("sci-label-"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSciLog({
      event: "carrier_event",
      level: "info",
      details: "api_key=secret-sci-key bearer abc123 token=xyz",
    });
    engine.createShipmentRequest({ includeFixtureShipment: true });
    const logs = getSciLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-sci-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, fulfilmentOrchestrator, procurementEngine } = await buildEngine();
    await seedFulfilment(procurementEngine, fulfilmentOrchestrator);
    engine.createShipmentRequest({ includeFixtureShipment: false });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.registeredCarriers >= SUPPORTED_CARRIER_IDENTIFIERS.length);
    assert.ok(cockpit.shipmentCount >= 1);
  });

  test("getLatestReport returns most recent shipment operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.requestShippingRates({ carrierId: "dhl" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.shipmentReportId, report.shipmentReportId);
  });
});
