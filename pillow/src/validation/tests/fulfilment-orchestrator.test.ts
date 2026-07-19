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
  buildFulfilmentOrchestratorConfiguration,
  FULFILMENT_ORCHESTRATOR_SYSTEM_PATH,
  FO_METADATA_VERSION,
} from "../../fulfilment-orchestrator/index.js";
import { appendFoLog, getFoLogs } from "../../fulfilment-orchestrator/fo-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildFulfilmentOrchestratorConfiguration>[1],
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
  const engine = createFulfilmentOrchestrator(bootstrap, procurementEngine, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, procurementEngine };
}

describe("R2-10 Fulfilment Orchestrator", () => {
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
  });

  test("buildFulfilmentOrchestratorConfiguration loads defaults", () => {
    const config = buildFulfilmentOrchestratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.fulfilmentRoutingRulesEnabled, true);
    assert.equal(config.requireApprovedProcurement, true);
  });

  test("fulfilment orchestrator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FO-001");
    assert.equal(state.missionId, "R2-10");
    assert.ok(FULFILMENT_ORCHESTRATOR_SYSTEM_PATH.includes("FULFILMENT"));
  });

  test("routeFulfilment routes order from approved procurement", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const procurementId = procurement.records[0]!.procurementId;
    const report = engine.routeFulfilment({
      orderReference: "ord-5001",
      procurementReference: procurementId,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, 1);
    assert.ok(report.routeSelection);
  });

  test("routeFulfilment produces machine-readable fo-* fulfilment records", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const report = engine.routeFulfilment({
      orderReference: "ord-5002",
      procurementReference: procurement.records[0]!.procurementId,
    });
    const record = report.records[0]!;
    assert.ok(record.fulfilmentId.startsWith("fo-"));
    assert.ok(report.fulfilmentReportId.startsWith("fo-run-"));
    assert.equal(record.metadataVersion, FO_METADATA_VERSION);
    assert.equal(record.orderReference, "ord-5002");
  });

  test("supplier fulfilment route is selected intelligently", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const report = engine.routeFulfilment({
      orderReference: "ord-5003",
      procurementReference: procurement.records[0]!.procurementId,
    });
    assert.equal(report.routeSelection?.fulfilmentRoute, "dropship_express");
    assert.equal(report.records[0]!.supplierId, "cj-dropshipping");
  });

  test("fulfilment workflow coordinates status to fulfilled", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "aex-prod-2002",
      requestedQuantity: 1,
    });
    const report = engine.routeFulfilment({
      orderReference: "ord-5004",
      procurementReference: procurement.records[0]!.procurementId,
    });
    assert.equal(report.records[0]!.fulfilmentStatus, "fulfilled");
    assert.equal(report.records[0]!.failureStatus, "none");
  });

  test("blocked workflow detected for unapproved procurement", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 10,
    });
    const procurementId = procurement.records[0]!.procurementId;
    assert.equal(procurement.records[0]!.approvalStatus, "pending");
    const report = engine.routeFulfilment({
      orderReference: "ord-5005",
      procurementReference: procurementId,
    });
    assert.ok(report.failures.some((f) => f.failureType === "workflow_blocked"));
    assert.equal(report.records.length, 0);
  });

  test("duplicate fulfilment requests are detected", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const procurementId = procurement.records[0]!.procurementId;
    engine.routeFulfilment({ orderReference: "ord-5006", procurementReference: procurementId });
    const report = engine.routeFulfilment({
      orderReference: "ord-5007",
      procurementReference: procurementId,
    });
    assert.ok(report.failures.some((f) => f.details.includes("Duplicate fulfilment")));
  });

  test("receiveFulfilmentRequirements routes using explicit requirements", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "oss-prod-3003",
      requestedQuantity: 5,
    });
    const procurementId = procurement.records[0]!.procurementId;
    const report = engine.receiveFulfilmentRequirements({
      orderReference: "ord-5008",
      procurementReference: procurementId,
      productReference: "oss-prod-3003",
      quantity: 5,
    });
    assert.equal(report.records[0]!.selectedFulfilmentRoute, "warehouse_dispatch");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine, procurementEngine } = await buildEngine();
    appendFoLog({
      event: "fulfilment_event",
      level: "info",
      details: "api_key=secret-fo-key bearer abc123 token=xyz",
    });
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    engine.routeFulfilment({
      procurementReference: procurement.records[0]!.procurementId,
    });
    const logs = getFoLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-fo-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    engine.routeFulfilment({
      procurementReference: procurement.records[0]!.procurementId,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.fulfilmentCount >= 1);
    assert.ok(cockpit.fulfilledCount >= 1);
  });

  test("getLatestReport returns most recent routing operation", async () => {
    const { engine, procurementEngine } = await buildEngine();
    const procurement = procurementEngine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const report = engine.routeFulfilment({
      orderReference: "ord-5009",
      procurementReference: procurement.records[0]!.procurementId,
    });
    const latest = engine.getLatestReport();
    assert.equal(latest?.fulfilmentReportId, report.fulfilmentReportId);
  });
});
