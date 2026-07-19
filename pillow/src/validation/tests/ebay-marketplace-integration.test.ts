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
  createEbayMarketplaceIntegrationEngine,
  resetEbayMarketplaceIntegrationForTesting,
  buildEbayMarketplaceIntegrationConfiguration,
  EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  EBAY_CAPABILITIES,
  EBAY_MARKETPLACE_ID,
} from "../../ebay-marketplace-integration/index.js";
import { appendEbayLog, getEbayLogs } from "../../ebay-marketplace-integration/ebay-logging.js";

async function buildEngine(configOverrides?: Parameters<typeof buildEbayMarketplaceIntegrationConfiguration>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createEbayMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-08 eBay Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetEbayMarketplaceIntegrationForTesting();
  });

  test("buildEbayMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildEbayMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://ebay-developer-api");
    assert.ok(EBAY_CAPABILITIES.includes("ebay_authentication"));
  });

  test("ebay marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EBAY-001");
    assert.equal(state.missionId, "R1-08");
    assert.ok(EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("EBAY_MARKETPLACE"));
  });

  test("connectEbay registers eBay with MCF via R1-08", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectEbay();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === EBAY_MARKETPLACE_ID));
  });

  test("connectEbay produces machine-readable ebay-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEbay();
    assert.ok(report.connectorRunReportId.startsWith("ebay-run-"));
    assert.ok(report.record.connectorId.startsWith("ebay-"));
    assert.equal(report.record.marketplaceIdentifier, "ebay");
    assert.equal(report.record.metadataVersion, "EBAY-001-v1");
    assert.ok(report.record.supportedEbayCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEbay({ credentialRef: "vault://ebay-developer-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getEbayLogs(50);
    assert.ok(!logs.some((l) => /bearer|oauth_token|refresh_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectEbay();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through eBay connector", async () => {
    const { engine } = await buildEngine();
    engine.connectEbay();
    const report = await engine.routeEbayApi({ method: "GET", path: "/sell/inventory/v1/inventory_item" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectEbay();
    const report = engine.handleEbayEvent({
      topic: "ITEM_SOLD",
      payloadRef: "payload-ref-ebay-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_event");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectEbay();
    await engine.routeEbayApi({ method: "GET", path: "/sell/inventory/v1/inventory_item/1" });
    await engine.routeEbayApi({ method: "GET", path: "/sell/inventory/v1/inventory_item/2" });
    const limited = await engine.routeEbayApi({ method: "GET", path: "/sell/inventory/v1/inventory_item/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendEbayLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-oauth-token bearer abc123",
    });
    engine.connectEbay();
    const logs = getEbayLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oauth-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectEbay();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
  });

  test("getLatestReport returns most recent eBay connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEbay();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
