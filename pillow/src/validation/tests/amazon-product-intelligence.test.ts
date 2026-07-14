import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketplaceConnectorFrameworkEngine,
  resetMarketplaceConnectorFrameworkForTesting,
} from "../../marketplace-connector-framework/index.js";
import {
  createAmazonMarketplaceIntegrationEngine,
  resetAmazonMarketplaceIntegrationForTesting,
} from "../../amazon-marketplace-integration/index.js";
import {
  createAmazonProductIntelligenceEngine,
  resetAmazonProductIntelligenceForTesting,
  buildAmazonProductIntelligenceConfiguration,
  AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH,
  AMAZON_PRODUCT_MARKETPLACE_ID,
} from "../../amazon-product-intelligence/index.js";
import { appendProductLog, getProductLogs } from "../../amazon-product-intelligence/amzprod-logging.js";

async function buildEngines() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const amazon = createAmazonMarketplaceIntegrationEngine(bootstrap, mcf);
  await amazon.initialize();
  amazon.connectAmazon();
  const engine = createAmazonProductIntelligenceEngine(bootstrap, amazon);
  await engine.initialize();
  return { engine, amazon, mcf };
}

describe("R1-03 Amazon Product Intelligence", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetAmazonMarketplaceIntegrationForTesting();
    resetAmazonProductIntelligenceForTesting();
  });

  test("buildAmazonProductIntelligenceConfiguration loads defaults", () => {
    const config = buildAmazonProductIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.syncFrequencyMinutes, 60);
    assert.equal(config.preserveExistingOnValidationFailure, true);
  });

  test("amazon product intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngines();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AMZPI-001");
    assert.equal(state.missionId, "R1-03");
    assert.ok(AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH.includes("AMAZON_PRODUCT"));
  });

  test("syncAmazonProducts fetches and synchronizes Amazon catalog records", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonProducts();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.syncReportId.startsWith("amzprod-sync-"));
    assert.equal(report.products.length, 3);
    assert.equal(engine.getCatalog().length, 3);
  });

  test("syncAmazonProducts produces machine-readable amzprod-* product records", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonProducts();
    const product = report.products[0]!;
    assert.ok(product.productId.startsWith("amzprod-"));
    assert.ok(product.amazonAsin);
    assert.equal(product.marketplaceId, AMAZON_PRODUCT_MARKETPLACE_ID);
    assert.equal(product.metadataVersion, "AMZPI-001-v1");
    assert.ok(product.sourceApiReference);
  });

  test("fetchAmazonProduct retrieves a single product by ASIN", async () => {
    const { engine } = await buildEngines();
    const report = await engine.fetchAmazonProduct({ asin: "B08N5WRWNW" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "fetch");
    assert.equal(report.products[0]?.amazonAsin, "B08N5WRWNW");
  });

  test("detects new Amazon products on first sync", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonProducts({ forceFullSync: true });
    assert.equal(report.changes.newProducts.length, 3);
    assert.ok(report.products.every((p) => p.synchronizationStatus === "new" || p.synchronizationStatus === "synced"));
  });

  test("detects updated Amazon products on subsequent sync", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonProducts();
    engine.configureSyncFixture({ updatedTitle: "Echo Dot (4th Gen) — Updated Edition" });
    const report = await engine.syncAmazonProducts();
    assert.equal(report.changes.updatedProducts.length, 1);
    assert.equal(report.changes.updatedProducts[0]?.amazonAsin, "B08N5WRWNW");
  });

  test("detects inactive Amazon products removed from catalog", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonProducts();
    engine.configureSyncFixture({ omitAsin: "B09B8V1LZ3" });
    const report = await engine.syncAmazonProducts();
    assert.equal(report.changes.inactiveProducts.length, 1);
    assert.equal(report.changes.inactiveProducts[0]?.amazonAsin, "B09B8V1LZ3");
    assert.equal(report.changes.inactiveProducts[0]?.productStatus, "inactive");
  });

  test("product mapping includes title SKU category and attributes", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonProducts();
    const product = report.products.find((p) => p.amazonAsin === "B08N5WRWNW")!;
    assert.ok(product.productTitle.includes("Echo Dot"));
    assert.equal(product.amazonSku, "AMZ-SKU-001");
    assert.ok(product.productCategory);
    assert.ok(product.productAttributes?.brand);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngines();
    appendProductLog({
      event: "product_fetch",
      level: "info",
      details: "token=secret-lwa-token bearer abc123",
    });
    await engine.syncAmazonProducts();
    const logs = getProductLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-lwa-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonProducts();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.catalogSize, 3);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent product sync operation", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonProducts();
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
