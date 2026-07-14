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
} from "../../amazon-product-intelligence/index.js";
import {
  createAmazonOrderManagementEngine,
  resetAmazonOrderManagementForTesting,
  buildAmazonOrderManagementConfiguration,
  AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH,
  AMAZON_ORDER_MARKETPLACE_ID,
} from "../../amazon-order-management/index.js";
import { appendOrderLog, getOrderLogs } from "../../amazon-order-management/amzord-logging.js";

async function buildEngines() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const amazon = createAmazonMarketplaceIntegrationEngine(bootstrap, mcf);
  await amazon.initialize();
  amazon.connectAmazon();
  const products = createAmazonProductIntelligenceEngine(bootstrap, amazon);
  await products.initialize();
  await products.syncAmazonProducts();
  const engine = createAmazonOrderManagementEngine(bootstrap, amazon, products);
  await engine.initialize();
  return { engine, amazon, products, mcf };
}

describe("R1-04 Amazon Order Management", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetAmazonMarketplaceIntegrationForTesting();
    resetAmazonProductIntelligenceForTesting();
    resetAmazonOrderManagementForTesting();
  });

  test("buildAmazonOrderManagementConfiguration loads defaults", () => {
    const config = buildAmazonOrderManagementConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.allowOrderModification, false);
    assert.equal(config.syncFrequencyMinutes, 15);
  });

  test("amazon order management initializes with doctrine doc", async () => {
    const { engine } = await buildEngines();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AMZO-001");
    assert.equal(state.missionId, "R1-04");
    assert.ok(AMAZON_ORDER_MANAGEMENT_SYSTEM_PATH.includes("AMAZON_ORDER"));
  });

  test("syncAmazonOrders fetches and synchronizes Amazon orders", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonOrders();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.syncReportId.startsWith("amzord-sync-"));
    assert.equal(report.orders.length, 3);
    assert.equal(engine.getOrders().length, 3);
  });

  test("syncAmazonOrders produces machine-readable amzord-* order records", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonOrders({ forceFullSync: true });
    const order = report.orders[0]!;
    assert.ok(order.orderId.startsWith("amzord-"));
    assert.ok(order.amazonOrderId);
    assert.equal(order.marketplaceId, AMAZON_ORDER_MARKETPLACE_ID);
    assert.equal(order.metadataVersion, "AMZO-001-v1");
    assert.ok(order.sourceApiReference);
    assert.ok(order.orderItems.length > 0);
  });

  test("fetchAmazonOrder retrieves a single order by Amazon order ID", async () => {
    const { engine } = await buildEngines();
    const report = await engine.fetchAmazonOrder({ amazonOrderId: "111-1234567-8901234" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "fetch");
    assert.equal(report.orders[0]?.amazonOrderId, "111-1234567-8901234");
  });

  test("detects new orders on first sync", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonOrders({ forceFullSync: true });
    assert.equal(report.changes.newOrders.length, 3);
  });

  test("detects updated orders on subsequent sync", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonOrders();
    engine.configureOrderFixture({ statusOverride: "shipped", fulfilmentOverride: "shipped" });
    const report = await engine.syncAmazonOrders();
    assert.equal(report.changes.updatedOrders.length, 1);
    assert.equal(report.changes.updatedOrders[0]?.amazonOrderId, "111-1234567-8901234");
  });

  test("detects cancelled orders", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonOrders();
    engine.configureOrderFixture({ statusOverride: "cancelled" });
    const report = await engine.syncAmazonOrders();
    assert.equal(report.changes.cancelledOrders.length, 1);
    assert.equal(report.changes.cancelledOrders[0]?.orderStatus, "cancelled");
  });

  test("detects fulfilled orders", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonOrders();
    engine.configureOrderFixture({ statusOverride: "fulfilled", fulfilmentOverride: "delivered" });
    const report = await engine.syncAmazonOrders();
    assert.equal(report.changes.fulfilledOrders.length, 1);
  });

  test("detects refunded orders when available", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonOrders();
    engine.configureOrderFixture({ refundOverride: "full", statusOverride: "refunded" });
    const report = await engine.syncAmazonOrders();
    assert.equal(report.changes.refundedOrders.length, 1);
    assert.equal(report.changes.refundedOrders[0]?.refundStatus, "full");
  });

  test("governance safety redacts sensitive buyer data in logs", async () => {
    const { engine } = await buildEngines();
    appendOrderLog({
      event: "order_fetch",
      level: "info",
      details: "buyer_email=secret@example.com buyer_name=John Doe",
    });
    await engine.syncAmazonOrders();
    const logs = getOrderLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret@example.com")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonOrders();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.orderCount, 3);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent order sync operation", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonOrders();
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
