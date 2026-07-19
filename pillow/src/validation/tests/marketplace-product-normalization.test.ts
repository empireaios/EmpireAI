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
  createMarketplaceProductNormalizationEngine,
  resetMarketplaceProductNormalizationForTesting,
  buildMarketplaceProductNormalizationConfiguration,
  MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH,
  UNIFIED_PRODUCT_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
} from "../../marketplace-product-normalization/index.js";
import {
  appendNormalizationLog,
  getNormalizationLogs,
} from "../../marketplace-product-normalization/mpn-logging.js";
import { getInvalidFixture } from "../../marketplace-product-normalization/marketplace-product-fixtures.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketplaceProductNormalizationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createMarketplaceProductNormalizationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-12 Marketplace Product Normalization", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetMarketplaceProductNormalizationForTesting();
  });

  test("buildMarketplaceProductNormalizationConfiguration loads defaults", () => {
    const config = buildMarketplaceProductNormalizationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.duplicateDetectionRulesEnabled, true);
    assert.equal(config.preserveSourceIdentifiers, true);
  });

  test("marketplace product normalization initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MPN-001");
    assert.equal(state.missionId, "R1-12");
    assert.ok(MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH.includes("MARKETPLACE_PRODUCT"));
  });

  test("normalizeProducts normalizes products from all supported marketplaces", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({ includeFixtureCatalog: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.products.length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
    assert.equal(engine.getCatalog().length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("normalizeProducts produces machine-readable mpn-* records with schema version", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({ marketplaceIdentifier: "amazon" });
    const product = report.products[0]!;
    assert.ok(product.productId.startsWith("mpn-amazon-"));
    assert.ok(report.normalizationReportId.startsWith("mpn-run-"));
    assert.equal(product.schemaVersion, UNIFIED_PRODUCT_SCHEMA_VERSION);
    assert.equal(product.metadataVersion, "MPN-001-v1");
    assert.equal(product.marketplaceIdentifier, "amazon");
    assert.equal(product.marketplaceProductId, "B08N5WRWNW");
  });

  test("marketplace-specific metadata and product identifiers are preserved", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({ marketplaceIdentifier: "woocommerce" });
    const product = report.products[0]!;
    assert.equal(product.marketplaceProductId, "woo-501");
    assert.ok(product.marketplaceMetadata.woocommerce_id);
    assert.ok(product.productTitle.includes("WordPress"));
  });

  test("marketplace field mapping includes title SKU category and attributes", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({ marketplaceIdentifier: "shopify" });
    const product = report.products[0]!;
    assert.ok(product.productTitle.includes("Organic Cotton"));
    assert.equal(product.sku, "TSHIRT-ORG-M");
    assert.equal(product.productCategory, "Apparel");
    assert.ok(product.productVariants && product.productVariants.length > 0);
    assert.equal(product.productBrand, "Empire Basics");
  });

  test("duplicate products are detected across marketplaces", async () => {
    const { engine } = await buildEngine();
    engine.setIncludeDuplicateFixturesForTesting(true);
    const report = await engine.normalizeProducts({ includeFixtureCatalog: true });
    assert.ok(report.duplicates.length > 0);
    const skuDup = report.duplicates.find((d) => d.matchType === "sku");
    assert.ok(skuDup);
    assert.ok(skuDup!.products.length >= 2);
  });

  test("missing product attributes are detected", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({
      rawProducts: [
        {
          marketplaceIdentifier: "amazon",
          marketplaceProductId: "B00MISSING",
          sourceData: { title: "Minimal Product" },
        },
      ],
    });
    assert.ok(report.missingAttributes.length > 0);
    assert.ok(
      report.missingAttributes[0]!.missingFields.some((f) =>
        ["sku", "productCategory", "productBrand"].includes(f),
      ),
    );
  });

  test("invalid product records are detected", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({
      rawProducts: [getInvalidFixture()],
    });
    assert.ok(report.invalidProducts.length > 0);
    assert.ok(report.invalidProducts[0]!.errors.length > 0);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendNormalizationLog({
      event: "normalization_event",
      level: "info",
      details: "consumer_key=secret-key bearer abc123 token=xyz",
    });
    await engine.normalizeProducts({ marketplaceIdentifier: "amazon" });
    const logs = getNormalizationLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.normalizeProducts({ includeFixtureCatalog: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, UNIFIED_PRODUCT_SCHEMA_VERSION);
    assert.equal(cockpit.catalogSize, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent normalization operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeProducts({ marketplaceIdentifier: "etsy" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.normalizationReportId, report.normalizationReportId);
  });
});
