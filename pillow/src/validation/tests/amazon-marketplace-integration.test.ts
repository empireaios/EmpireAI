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
  buildAmazonMarketplaceIntegrationConfiguration,
  AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  AMAZON_CAPABILITIES,
  AMAZON_MARKETPLACE_ID,
} from "../../amazon-marketplace-integration/index.js";
import { appendAmazonLog, getAmazonLogs } from "../../amazon-marketplace-integration/amz-logging.js";

async function buildEngine(configOverrides?: Parameters<typeof buildAmazonMarketplaceIntegrationConfiguration>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createAmazonMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-02 Amazon Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetAmazonMarketplaceIntegrationForTesting();
  });

  test("buildAmazonMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildAmazonMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://amazon-sp-api");
    assert.ok(AMAZON_CAPABILITIES.includes("amazon_authentication"));
  });

  test("amazon marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AMZ-001");
    assert.equal(state.missionId, "R1-02");
    assert.ok(AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("AMAZON_MARKETPLACE"));
  });

  test("connectAmazon registers Amazon with MCF via R1-02", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectAmazon();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === AMAZON_MARKETPLACE_ID));
  });

  test("connectAmazon produces machine-readable amz-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAmazon();
    assert.ok(report.connectorRunReportId.startsWith("amz-run-"));
    assert.ok(report.record.connectorId.startsWith("amz-"));
    assert.equal(report.record.marketplaceIdentifier, "amazon");
    assert.equal(report.record.metadataVersion, "AMZ-001-v1");
    assert.ok(report.record.supportedAmazonCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAmazon({ credentialRef: "vault://amazon-sp-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getAmazonLogs(50);
    assert.ok(!logs.some((l) => /bearer|lwa_token|refresh_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectAmazon();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through Amazon connector", async () => {
    const { engine } = await buildEngine();
    engine.connectAmazon();
    const report = await engine.routeAmazonApi({ method: "GET", path: "/catalog/2022-04-01/items" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectAmazon();
    const report = engine.handleAmazonEvent({
      topic: "ORDER_CHANGE",
      payloadRef: "payload-ref-amz-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_event");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectAmazon();
    await engine.routeAmazonApi({ method: "GET", path: "/orders/v0/orders/1" });
    await engine.routeAmazonApi({ method: "GET", path: "/orders/v0/orders/2" });
    const limited = await engine.routeAmazonApi({ method: "GET", path: "/orders/v0/orders/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAmazonLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-lwa-token bearer abc123",
    });
    engine.connectAmazon();
    const logs = getAmazonLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-lwa-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAmazon();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
  });

  test("getLatestReport returns most recent Amazon connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAmazon();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
