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
  createWooCommerceMarketplaceIntegrationEngine,
  resetWooCommerceMarketplaceIntegrationForTesting,
  buildWooCommerceMarketplaceIntegrationConfiguration,
  WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  WOOCOMMERCE_CAPABILITIES,
  WOOCOMMERCE_MARKETPLACE_ID,
} from "../../woocommerce-marketplace-integration/index.js";
import {
  appendWooCommerceLog,
  getWooCommerceLogs,
} from "../../woocommerce-marketplace-integration/woocommerce-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildWooCommerceMarketplaceIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createWooCommerceMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-11 WooCommerce Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetWooCommerceMarketplaceIntegrationForTesting();
  });

  test("buildWooCommerceMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildWooCommerceMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://woocommerce-rest-api");
    assert.equal(config.webhookRulesEnabled, true);
    assert.ok(WOOCOMMERCE_CAPABILITIES.includes("woocommerce_authentication"));
  });

  test("woocommerce marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-WOO-001");
    assert.equal(state.missionId, "R1-11");
    assert.ok(WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("WOOCOMMERCE"));
  });

  test("connectWooCommerce registers WooCommerce with MCF via R1-11", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectWooCommerce({
      storeId: "store-woo-001",
      storeUrl: "https://empire-demo.wordpress.example",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === WOOCOMMERCE_MARKETPLACE_ID));
  });

  test("connectWooCommerce produces machine-readable woo-* connector records with store ID and URL", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWooCommerce({
      storeId: "store-woo-001",
      storeUrl: "https://empire-demo.wordpress.example",
    });
    assert.ok(report.connectorRunReportId.startsWith("woo-run-"));
    assert.ok(report.record.connectorId.startsWith("woo-"));
    assert.equal(report.record.marketplaceIdentifier, "woocommerce");
    assert.equal(report.record.storeId, "store-woo-001");
    assert.equal(report.record.storeUrl, "https://empire-demo.wordpress.example");
    assert.equal(report.record.metadataVersion, "WOO-001-v1");
    assert.ok(report.record.supportedWooCommerceCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWooCommerce({
      credentialRef: "vault://woocommerce-rest-api",
      storeId: "store-woo-002",
      storeUrl: "https://secure.wordpress.example",
    });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getWooCommerceLogs(50);
    assert.ok(!logs.some((l) => /bearer|consumer_key|consumer_secret|oauth_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectWooCommerce({
      storeId: "store-woo-003",
      storeUrl: "https://test.wordpress.example",
    });
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through WooCommerce connector", async () => {
    const { engine } = await buildEngine();
    engine.connectWooCommerce({
      storeId: "store-woo-004",
      storeUrl: "https://api.wordpress.example",
    });
    const report = await engine.routeWooCommerceApi({
      method: "GET",
      path: "/wp-json/wc/v3/products",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectWooCommerce({
      storeId: "store-woo-005",
      storeUrl: "https://webhook.wordpress.example",
    });
    const report = engine.handleWooCommerceWebhook({
      topic: "order.created",
      payloadRef: "payload-ref-woo-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectWooCommerce({
      storeId: "store-woo-006",
      storeUrl: "https://limit.wordpress.example",
    });
    await engine.routeWooCommerceApi({ method: "GET", path: "/wp-json/wc/v3/products/1" });
    await engine.routeWooCommerceApi({ method: "GET", path: "/wp-json/wc/v3/products/2" });
    const limited = await engine.routeWooCommerceApi({
      method: "GET",
      path: "/wp-json/wc/v3/products/3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendWooCommerceLog({
      event: "authentication_event",
      level: "info",
      details: "consumer_key=secret-key consumer_secret=secret-secret bearer abc123",
    });
    engine.connectWooCommerce({
      storeId: "store-woo-007",
      storeUrl: "https://safe.wordpress.example",
    });
    const logs = getWooCommerceLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectWooCommerce({
      storeId: "store-woo-008",
      storeUrl: "https://cockpit.wordpress.example",
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
    assert.equal(cockpit.storeId, "store-woo-008");
    assert.equal(cockpit.storeUrl, "https://cockpit.wordpress.example");
  });

  test("getLatestReport returns most recent WooCommerce connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWooCommerce({
      storeId: "store-woo-009",
      storeUrl: "https://latest.wordpress.example",
    });
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
