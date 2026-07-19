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
  buildProcurementEngineConfiguration,
  PROCUREMENT_ENGINE_SYSTEM_PATH,
  PCE_METADATA_VERSION,
} from "../../procurement-engine/index.js";
import { appendPceLog, getPceLogs } from "../../procurement-engine/pce-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildProcurementEngineConfiguration>[1],
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
  const engine = createProcurementEngine(
    bootstrap,
    productSync,
    inventorySync,
    pricingEngine,
    rankingEngine,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, rankingEngine };
}

describe("R2-09 Procurement Engine", () => {
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
  });

  test("buildProcurementEngineConfiguration loads defaults", () => {
    const config = buildProcurementEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.supplierSelectionRulesEnabled, true);
    assert.equal(config.autoApproveBelowCost, 50);
    assert.equal(config.requireApprovalAboveCost, 100);
  });

  test("procurement engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PCE-001");
    assert.equal(state.missionId, "R2-09");
    assert.ok(PROCUREMENT_ENGINE_SYSTEM_PATH.includes("PROCUREMENT"));
  });

  test("createProcurementRequest creates procurement successfully", async () => {
    const { engine } = await buildEngine();
    const report = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, 1);
    assert.ok(report.selection);
  });

  test("createProcurementRequest produces machine-readable pce-* records", async () => {
    const { engine } = await buildEngine();
    const report = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const record = report.records[0]!;
    assert.ok(record.procurementId.startsWith("pce-"));
    assert.ok(report.procurementReportId.startsWith("pce-run-"));
    assert.equal(record.metadataVersion, PCE_METADATA_VERSION);
    assert.ok(record.purchaseOrderId?.startsWith("pce-po-"));
  });

  test("optimal supplier is selected using rankings pricing and inventory", async () => {
    const { engine, rankingEngine } = await buildEngine();
    const top = rankingEngine.getRankings().find((r) => r.rankingPosition === 1);
    const report = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    assert.equal(report.selection?.selectedSupplierId, "cj-dropshipping");
    assert.ok(report.selection!.rankingScore >= (top?.overallSupplierScore ?? 0) - 5);
  });

  test("purchase order is created for auto-approved procurement", async () => {
    const { engine } = await buildEngine();
    const report = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 1,
    });
    const record = report.records[0]!;
    assert.equal(record.approvalStatus, "auto_approved");
    assert.equal(record.procurementStatus, "purchase_order_created");
    assert.ok(report.purchaseOrder);
    assert.ok(report.purchaseOrder!.purchaseOrderId.startsWith("pce-po-"));
  });

  test("high-cost procurement requires approval before purchase order", async () => {
    const { engine } = await buildEngine();
    const report = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 10,
    });
    const record = report.records[0]!;
    assert.equal(record.approvalStatus, "pending");
    assert.equal(record.procurementStatus, "pending_approval");
    assert.equal(record.purchaseOrderId, null);
    assert.equal(report.purchaseOrder, null);
  });

  test("approveProcurement creates purchase order after approval", async () => {
    const { engine } = await buildEngine();
    const request = engine.createProcurementRequest({
      productReference: "cj-prod-1001",
      requestedQuantity: 10,
    });
    const procurementId = request.records[0]!.procurementId;
    const approval = engine.approveProcurement({ procurementId, approved: true });
    const record = approval.records[0]!;
    assert.equal(record.approvalStatus, "approved");
    assert.equal(record.procurementStatus, "purchase_order_created");
    assert.ok(approval.purchaseOrder);
  });

  test("procurement lifecycle tracks status transitions", async () => {
    const { engine } = await buildEngine();
    engine.createProcurementRequest({ productReference: "aex-prod-2002", requestedQuantity: 1 });
    const state = engine.getState();
    assert.ok(state.records.length >= 1);
    assert.ok(state.purchaseOrders.length >= 1);
    assert.ok(
      ["purchase_order_created", "pending_approval", "approved"].includes(
        state.records[0]!.procurementStatus,
      ),
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPceLog({
      event: "procurement_event",
      level: "info",
      details: "api_key=secret-pce-key bearer abc123 token=xyz",
    });
    engine.createProcurementRequest({ productReference: "cj-prod-1001", requestedQuantity: 1 });
    const logs = getPceLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-pce-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.createProcurementRequest({ productReference: "cj-prod-1001", requestedQuantity: 1 });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.procurementCount >= 1);
    assert.ok(cockpit.purchaseOrdersCreated >= 1);
  });

  test("getLatestReport returns most recent procurement operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.createProcurementRequest({
      productReference: "oss-prod-3003",
      requestedQuantity: 5,
    });
    const latest = engine.getLatestReport();
    assert.equal(latest?.procurementReportId, report.procurementReportId);
  });
});
