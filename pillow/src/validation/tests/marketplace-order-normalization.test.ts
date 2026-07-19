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
  createMarketplaceOrderNormalizationEngine,
  resetMarketplaceOrderNormalizationForTesting,
  buildMarketplaceOrderNormalizationConfiguration,
  MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH,
  UNIFIED_ORDER_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
} from "../../marketplace-order-normalization/index.js";
import {
  appendOrderNormalizationLog,
  getOrderNormalizationLogs,
} from "../../marketplace-order-normalization/mon-logging.js";
import { getInvalidFixture } from "../../marketplace-order-normalization/marketplace-order-fixtures.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketplaceOrderNormalizationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createMarketplaceOrderNormalizationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-13 Marketplace Order Normalization", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetMarketplaceOrderNormalizationForTesting();
  });

  test("buildMarketplaceOrderNormalizationConfiguration loads defaults", () => {
    const config = buildMarketplaceOrderNormalizationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.duplicateDetectionRulesEnabled, true);
    assert.equal(config.preserveSourceIdentifiers, true);
  });

  test("marketplace order normalization initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MON-001");
    assert.equal(state.missionId, "R1-13");
    assert.ok(MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH.includes("MARKETPLACE_ORDER"));
  });

  test("normalizeOrders normalizes orders from all supported marketplaces", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({ includeFixtureCatalog: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.orders.length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
    assert.equal(engine.getCatalog().length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("normalizeOrders produces machine-readable mon-* records with schema version", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({ marketplaceIdentifier: "amazon" });
    const order = report.orders[0]!;
    assert.ok(order.orderId.startsWith("mon-amazon-"));
    assert.ok(report.normalizationReportId.startsWith("mon-run-"));
    assert.equal(order.schemaVersion, UNIFIED_ORDER_SCHEMA_VERSION);
    assert.equal(order.metadataVersion, "MON-001-v1");
    assert.equal(order.marketplaceIdentifier, "amazon");
    assert.equal(order.marketplaceOrderId, "AMZ-ORD-10001");
  });

  test("marketplace-specific metadata and order identifiers are preserved", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({ marketplaceIdentifier: "woocommerce" });
    const order = report.orders[0]!;
    assert.equal(order.marketplaceOrderId, "woo-ord-80007");
    assert.ok(order.marketplaceMetadata.marketplace_order_id);
    assert.ok(order.orderItems.length > 0);
  });

  test("marketplace field mapping includes status items and pricing summary", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({ marketplaceIdentifier: "shopify" });
    const order = report.orders[0]!;
    assert.equal(order.orderStatus, "open");
    assert.equal(order.paymentStatus, "paid");
    assert.ok(order.orderItems.length > 0);
    assert.ok(order.pricingSummary.total > 0);
    assert.equal(order.currency, "USD");
  });

  test("duplicate orders are detected across marketplaces", async () => {
    const { engine } = await buildEngine();
    engine.setIncludeDuplicateFixturesForTesting(true);
    const report = await engine.normalizeOrders({ includeFixtureCatalog: true });
    assert.ok(report.duplicates.length > 0);
    const custDup = report.duplicates.find((d) => d.matchType === "customer_reference");
    assert.ok(custDup);
    assert.ok(custDup!.orders.length >= 2);
  });

  test("missing order attributes are detected", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({
      rawOrders: [
        {
          marketplaceIdentifier: "amazon",
          marketplaceOrderId: "AMZ-ORD-MIN",
          sourceData: {
            order_status: "Pending",
            line_items: [{ id: "li-min", title: "Minimal Item", quantity: 1, price: 10 }],
          },
        },
      ],
    });
    assert.ok(report.missingAttributes.length > 0);
    assert.ok(
      report.missingAttributes[0]!.missingFields.some((f) =>
        ["customerReference", "paymentStatus", "fulfilmentStatus"].includes(f),
      ),
    );
  });

  test("invalid order records are detected", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({
      rawOrders: [getInvalidFixture()],
    });
    assert.ok(report.invalidOrders.length > 0);
    assert.ok(report.invalidOrders[0]!.errors.length > 0);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendOrderNormalizationLog({
      event: "normalization_event",
      level: "info",
      details: "consumer_key=secret-key bearer abc123 token=xyz",
    });
    await engine.normalizeOrders({ marketplaceIdentifier: "amazon" });
    const logs = getOrderNormalizationLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.normalizeOrders({ includeFixtureCatalog: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, UNIFIED_ORDER_SCHEMA_VERSION);
    assert.equal(cockpit.catalogSize, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent normalization operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.normalizeOrders({ marketplaceIdentifier: "etsy" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.normalizationReportId, report.normalizationReportId);
  });
});
