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
  createShopifyStoreMarketplaceIntegrationEngine,
  resetShopifyStoreMarketplaceIntegrationForTesting,
  buildShopifyStoreMarketplaceIntegrationConfiguration,
  SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  SHOPIFY_STORE_CAPABILITIES,
  SHOPIFY_STORE_MARKETPLACE_ID,
} from "../../shopify-store-marketplace-integration/index.js";
import {
  appendShopifyStoreLog,
  getShopifyStoreLogs,
} from "../../shopify-store-marketplace-integration/shopify-store-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildShopifyStoreMarketplaceIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createShopifyStoreMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-10 Shopify Store Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetShopifyStoreMarketplaceIntegrationForTesting();
  });

  test("buildShopifyStoreMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildShopifyStoreMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://shopify-admin-api");
    assert.equal(config.webhookRulesEnabled, true);
    assert.ok(SHOPIFY_STORE_CAPABILITIES.includes("shopify_authentication"));
  });

  test("shopify store marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SHF-001");
    assert.equal(state.missionId, "R1-10");
    assert.ok(SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("SHOPIFY_STORE"));
  });

  test("connectShopifyStore registers Shopify with MCF via R1-10", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectShopifyStore({
      storeId: "store-shf-001",
      storeDomain: "empire-demo.myshopify.com",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === SHOPIFY_STORE_MARKETPLACE_ID));
  });

  test("connectShopifyStore produces machine-readable shf-* connector records with store ID and domain", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectShopifyStore({
      storeId: "store-shf-001",
      storeDomain: "empire-demo.myshopify.com",
    });
    assert.ok(report.connectorRunReportId.startsWith("shf-run-"));
    assert.ok(report.record.connectorId.startsWith("shf-"));
    assert.equal(report.record.marketplaceIdentifier, "shopify");
    assert.equal(report.record.storeId, "store-shf-001");
    assert.equal(report.record.storeDomain, "empire-demo.myshopify.com");
    assert.equal(report.record.metadataVersion, "SHF-001-v1");
    assert.ok(report.record.supportedShopifyStoreCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectShopifyStore({
      credentialRef: "vault://shopify-admin-api",
      storeId: "store-shf-002",
      storeDomain: "secure.myshopify.com",
    });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getShopifyStoreLogs(50);
    assert.ok(!logs.some((l) => /bearer|oauth_token|refresh_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectShopifyStore({
      storeId: "store-shf-003",
      storeDomain: "test.myshopify.com",
    });
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through Shopify connector", async () => {
    const { engine } = await buildEngine();
    engine.connectShopifyStore({
      storeId: "store-shf-004",
      storeDomain: "api.myshopify.com",
    });
    const report = await engine.routeShopifyStoreApi({
      method: "GET",
      path: "/admin/api/2024-10/products.json",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectShopifyStore({
      storeId: "store-shf-005",
      storeDomain: "webhook.myshopify.com",
    });
    const report = engine.handleShopifyStoreWebhook({
      topic: "ORDERS_CREATE",
      payloadRef: "payload-ref-shf-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectShopifyStore({
      storeId: "store-shf-006",
      storeDomain: "limit.myshopify.com",
    });
    await engine.routeShopifyStoreApi({ method: "GET", path: "/admin/api/2024-10/products/1.json" });
    await engine.routeShopifyStoreApi({ method: "GET", path: "/admin/api/2024-10/products/2.json" });
    const limited = await engine.routeShopifyStoreApi({
      method: "GET",
      path: "/admin/api/2024-10/products/3.json",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendShopifyStoreLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-oauth-token bearer abc123",
    });
    engine.connectShopifyStore({
      storeId: "store-shf-007",
      storeDomain: "safe.myshopify.com",
    });
    const logs = getShopifyStoreLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oauth-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectShopifyStore({
      storeId: "store-shf-008",
      storeDomain: "cockpit.myshopify.com",
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
    assert.equal(cockpit.storeId, "store-shf-008");
    assert.equal(cockpit.storeDomain, "cockpit.myshopify.com");
  });

  test("getLatestReport returns most recent Shopify connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectShopifyStore({
      storeId: "store-shf-009",
      storeDomain: "latest.myshopify.com",
    });
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
