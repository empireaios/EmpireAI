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
  buildSupplierPricingEngineConfiguration,
  SUPPLIER_PRICING_ENGINE_SYSTEM_PATH,
  SPE_METADATA_VERSION,
  SUPPLIER_PRICING_SUPPLIER_IDENTIFIERS,
} from "../../supplier-pricing-engine/index.js";
import { appendSpeLog, getSpeLogs } from "../../supplier-pricing-engine/spe-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildSupplierPricingEngineConfiguration>[1],
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
  const engine = createSupplierPricingEngine(bootstrap, productSync, inventorySync, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, productSync, inventorySync };
}

describe("R2-07 Supplier Pricing Engine", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
    resetAliExpressIntegrationForTesting();
    resetOss1688IntegrationForTesting();
    resetSupplierProductSyncForTesting();
    resetSupplierInventorySyncForTesting();
    resetSupplierPricingEngineForTesting();
  });

  test("buildSupplierPricingEngineConfiguration loads defaults", () => {
    const config = buildSupplierPricingEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.priceValidationRulesEnabled, true);
    assert.equal(config.priceAnomalyThresholdPercent, 50);
    assert.equal(config.landedCostRulesEnabled, true);
  });

  test("supplier pricing engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SPE-001");
    assert.equal(state.missionId, "R2-07");
    assert.ok(SUPPLIER_PRICING_ENGINE_SYSTEM_PATH.includes("SUPPLIER_PRICING"));
  });

  test("syncSupplierPricing synchronizes pricing from all supported suppliers", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierPricing({ includeFixturePricing: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.pricing.length, 3);
  });

  test("syncSupplierPricing produces machine-readable spe-* pricing records", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierPricing({ supplierId: "cj-dropshipping" });
    const record = report.pricing[0]!;
    assert.ok(record.pricingRecordId.startsWith("spe-cj-dropshipping-"));
    assert.ok(report.syncReportId.startsWith("spe-run-"));
    assert.equal(record.metadataVersion, SPE_METADATA_VERSION);
    assert.equal(record.supplierId, "cj-dropshipping");
  });

  test("internal product ID is mapped from R2-05 supplier product catalog", async () => {
    const { engine, productSync } = await buildEngine();
    const catalog = productSync.getCatalog();
    const report = await engine.syncSupplierPricing({ includeFixturePricing: true });
    const record = report.pricing.find((r) => r.supplierId === "aliexpress")!;
    const product = catalog.find((p) => p.supplierId === "aliexpress")!;
    assert.equal(record.internalProductId, product.productId);
  });

  test("pricing mapping includes price, currency, and landed cost", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierPricing({ supplierId: "1688" });
    const record = report.pricing[0]!;
    assert.equal(record.currentSupplierPrice, 1.2);
    assert.equal(record.currency, "USD");
    assert.equal(record.landedCost, 1.38);
  });

  test("price increases are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierPricing({ includeFixturePricing: true });
    const report = await engine.syncSupplierPricing({
      includeFixturePricing: false,
      changeFixtureMode: "increase",
    });
    assert.ok(report.changes.some((c) => c.changeType === "increase"));
  });

  test("price decreases are detected on subsequent sync", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierPricing({ includeFixturePricing: true });
    const report = await engine.syncSupplierPricing({
      includeFixturePricing: false,
      changeFixtureMode: "decrease",
    });
    assert.ok(report.changes.some((c) => c.changeType === "decrease"));
  });

  test("historical pricing is maintained across synchronizations", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierPricing({ includeFixturePricing: true });
    const report = await engine.syncSupplierPricing({
      includeFixturePricing: false,
      changeFixtureMode: "increase",
    });
    assert.ok(report.history.length >= 3);
    const state = engine.getState();
    assert.ok(state.history.length >= 3);
  });

  test("abnormal price movements are detected as anomalies", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierPricing({ includeFixturePricing: true });
    const report = await engine.syncSupplierPricing({
      includeFixturePricing: false,
      changeFixtureMode: "anomaly",
    });
    assert.ok(report.changes.some((c) => c.changeType === "anomaly"));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSpeLog({
      event: "synchronization_event",
      level: "info",
      details: "api_key=secret-spe-key bearer abc123 token=xyz",
    });
    await engine.syncSupplierPricing({ supplierId: "cj-dropshipping" });
    const logs = getSpeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-spe-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.syncSupplierPricing({ includeFixturePricing: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.pricingCount, SUPPLIER_PRICING_SUPPLIER_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent synchronization operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.syncSupplierPricing({ supplierId: "aliexpress" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
