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
  buildSupplierProductSyncConfiguration,
  SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH,
  SUPPLIER_PRODUCT_CATALOG_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
} from "../../supplier-product-sync/index.js";
import { appendSpsLog, getSpsLogs } from "../../supplier-product-sync/sps-logging.js";
import { getInvalidFixture } from "../../supplier-product-sync/supplier-product-fixtures.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSupplierProductSyncConfiguration>[1],
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
  const engine = createSupplierProductSyncEngine(bootstrap, cj, aliexpress, oss1688, sf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, sf };
}

describe("R2-05 Supplier Product Sync", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
    resetAliExpressIntegrationForTesting();
    resetOss1688IntegrationForTesting();
    resetSupplierProductSyncForTesting();
  });

  test("buildSupplierProductSyncConfiguration loads defaults", () => {
    const config = buildSupplierProductSyncConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.changeDetectionRulesEnabled, true);
    assert.equal(config.preserveSupplierProductIdentifiers, true);
  });

  test("supplier product sync initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SPS-001");
    assert.equal(state.missionId, "R2-05");
    assert.ok(SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH.includes("SUPPLIER_PRODUCT"));
  });

  test("syncSupplierProducts synchronizes catalogs from all supported suppliers", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.products.filter((p) => p.productStatus === "active").length, 3);
    assert.equal(engine.getCatalog().filter((p) => p.productStatus === "active").length, 3);
  });

  test("syncSupplierProducts produces machine-readable sps-* supplier product records", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierProducts({ supplierId: "cj-dropshipping" });
    const product = report.products[0]!;
    assert.ok(product.productId.startsWith("sps-cj-dropshipping-"));
    assert.ok(report.syncReportId.startsWith("sps-run-"));
    assert.equal(product.metadataVersion, "SPS-001-v1");
    assert.equal(report.catalogVersion, SUPPLIER_PRODUCT_CATALOG_VERSION);
    assert.equal(product.supplierId, "cj-dropshipping");
  });

  test("supplier-specific metadata and product identifiers are preserved", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierProducts({ supplierId: "1688" });
    const product = report.products[0]!;
    assert.equal(product.supplierProductId, "oss-prod-3003");
    assert.ok(product.supplierMetadata.supplier_product_id);
    assert.ok(product.productTitle.includes("Tote"));
  });

  test("product mapping includes title SKU category and attributes", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierProducts({ supplierId: "aliexpress" });
    const product = report.products[0]!;
    assert.ok(product.productTitle.includes("Magnetic"));
    assert.equal(product.sku, "AEX-MNT-002");
    assert.equal(product.productCategory, "Automotive");
    assert.ok(product.productAttributes?.material);
  });

  test("new supplier products are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    const report = await engine.syncSupplierProducts({
      includeFixtureCatalog: false,
      changeFixtureMode: "new",
    });
    assert.ok(report.changes.some((c) => c.changeType === "new"));
  });

  test("updated supplier products are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    const report = await engine.syncSupplierProducts({
      includeFixtureCatalog: false,
      changeFixtureMode: "updated",
    });
    assert.ok(report.changes.some((c) => c.changeType === "updated"));
  });

  test("discontinued supplier products are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    const report = await engine.syncSupplierProducts({
      includeFixtureCatalog: false,
      changeFixtureMode: "discontinued",
    });
    assert.ok(report.changes.some((c) => c.changeType === "discontinued"));
    assert.ok(report.products.some((p) => p.productStatus === "discontinued"));
  });

  test("duplicate supplier products are detected across suppliers", async () => {
    const { engine } = await buildEngine();
    engine.setIncludeDuplicateFixturesForTesting(true);
    const report = await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    assert.ok(report.duplicates.length > 0);
    const skuDup = report.duplicates.find((d) => d.matchType === "sku");
    assert.ok(skuDup);
    assert.ok(skuDup!.products.length >= 2);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSpsLog({
      event: "synchronization_event",
      level: "info",
      details: "api_key=secret-sps-key bearer abc123 token=xyz",
    });
    await engine.syncSupplierProducts({ supplierId: "cj-dropshipping" });
    const logs = getSpsLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-sps-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierProducts({ includeFixtureCatalog: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.catalogVersion, SUPPLIER_PRODUCT_CATALOG_VERSION);
    assert.equal(cockpit.catalogSize, SUPPORTED_SUPPLIER_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent synchronization operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierProducts({ supplierId: "aliexpress" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
