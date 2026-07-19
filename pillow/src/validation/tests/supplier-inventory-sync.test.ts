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
  buildSupplierInventorySyncConfiguration,
  SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH,
  SIS_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
} from "../../supplier-inventory-sync/index.js";
import { appendSisLog, getSisLogs } from "../../supplier-inventory-sync/sis-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSupplierInventorySyncConfiguration>[1],
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
  const engine = createSupplierInventorySyncEngine(bootstrap, productSync, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, productSync };
}

describe("R2-06 Supplier Inventory Sync", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
    resetAliExpressIntegrationForTesting();
    resetOss1688IntegrationForTesting();
    resetSupplierProductSyncForTesting();
    resetSupplierInventorySyncForTesting();
  });

  test("buildSupplierInventorySyncConfiguration loads defaults", () => {
    const config = buildSupplierInventorySyncConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.changeDetectionRulesEnabled, true);
    assert.equal(config.lowStockThreshold, 10);
  });

  test("supplier inventory sync initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SIS-001");
    assert.equal(state.missionId, "R2-06");
    assert.ok(SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH.includes("SUPPLIER_INVENTORY"));
  });

  test("syncSupplierInventory synchronizes stock from all supported suppliers", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierInventory({ includeFixtureInventory: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(
      report.inventory.filter((r) => r.stockAvailabilityStatus !== "discontinued").length,
      3,
    );
  });

  test("syncSupplierInventory produces machine-readable sis-* inventory records", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierInventory({ supplierId: "cj-dropshipping" });
    const record = report.inventory[0]!;
    assert.ok(record.inventoryRecordId.startsWith("sis-cj-dropshipping-"));
    assert.ok(report.syncReportId.startsWith("sis-run-"));
    assert.equal(record.metadataVersion, SIS_METADATA_VERSION);
    assert.equal(record.supplierId, "cj-dropshipping");
  });

  test("internal product ID is mapped from R2-05 supplier product catalog", async () => {
    const { engine, productSync } = await buildEngine();
    const catalog = productSync.getCatalog();
    const report = await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const record = report.inventory.find((r) => r.supplierId === "aliexpress")!;
    const product = catalog.find((p) => p.supplierId === "aliexpress")!;
    assert.equal(record.internalProductId, product.productId);
  });

  test("inventory mapping includes stock quantity and availability status", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierInventory({ supplierId: "1688" });
    const record = report.inventory[0]!;
    assert.equal(record.currentStockQuantity, 1200);
    assert.equal(record.stockAvailabilityStatus, "in_stock");
    assert.equal(record.inventorySource, "supplier:1688");
  });

  test("stock increases are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const report = await engine.syncSupplierInventory({
      includeFixtureInventory: false,
      changeFixtureMode: "increase",
    });
    assert.ok(report.changes.some((c) => c.changeType === "increase"));
  });

  test("stock decreases are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const report = await engine.syncSupplierInventory({
      includeFixtureInventory: false,
      changeFixtureMode: "decrease",
    });
    assert.ok(report.changes.some((c) => c.changeType === "decrease"));
  });

  test("out-of-stock products are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const report = await engine.syncSupplierInventory({
      includeFixtureInventory: false,
      changeFixtureMode: "out_of_stock",
    });
    assert.ok(report.changes.some((c) => c.changeType === "out_of_stock"));
    assert.ok(report.inventory.some((r) => r.stockAvailabilityStatus === "out_of_stock"));
  });

  test("discontinued inventory is detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const report = await engine.syncSupplierInventory({
      includeFixtureInventory: false,
      changeFixtureMode: "discontinued",
    });
    assert.ok(report.changes.some((c) => c.changeType === "discontinued"));
    assert.ok(report.inventory.some((r) => r.stockAvailabilityStatus === "discontinued"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSisLog({
      event: "synchronization_event",
      level: "info",
      details: "api_key=secret-sis-key bearer abc123 token=xyz",
    });
    await engine.syncSupplierInventory({ supplierId: "cj-dropshipping" });
    const logs = getSisLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-sis-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierInventory({ includeFixtureInventory: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.inventoryCount, SUPPORTED_SUPPLIER_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent synchronization operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierInventory({ supplierId: "aliexpress" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
