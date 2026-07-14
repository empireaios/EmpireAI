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
  createEtsyMarketplaceIntegrationEngine,
  resetEtsyMarketplaceIntegrationForTesting,
  buildEtsyMarketplaceIntegrationConfiguration,
  ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  ETSY_CAPABILITIES,
  ETSY_MARKETPLACE_ID,
} from "../../etsy-marketplace-integration/index.js";
import { appendEtsyLog, getEtsyLogs } from "../../etsy-marketplace-integration/etsy-logging.js";

async function buildEngine(configOverrides?: Parameters<typeof buildEtsyMarketplaceIntegrationConfiguration>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createEtsyMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-07 Etsy Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetEtsyMarketplaceIntegrationForTesting();
  });

  test("buildEtsyMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildEtsyMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://etsy-open-api");
    assert.ok(ETSY_CAPABILITIES.includes("etsy_authentication"));
  });

  test("etsy marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ETSY-001");
    assert.equal(state.missionId, "R1-07");
    assert.ok(ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("ETSY_MARKETPLACE"));
  });

  test("connectEtsy registers Etsy with MCF via R1-07", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectEtsy();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === ETSY_MARKETPLACE_ID));
  });

  test("connectEtsy produces machine-readable etsy-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEtsy();
    assert.ok(report.connectorRunReportId.startsWith("etsy-run-"));
    assert.ok(report.record.connectorId.startsWith("etsy-"));
    assert.equal(report.record.marketplaceIdentifier, "etsy");
    assert.equal(report.record.metadataVersion, "ETSY-001-v1");
    assert.ok(report.record.supportedEtsyCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEtsy({ credentialRef: "vault://etsy-open-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getEtsyLogs(50);
    assert.ok(!logs.some((l) => /bearer|oauth_token|refresh_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectEtsy();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through Etsy connector", async () => {
    const { engine } = await buildEngine();
    engine.connectEtsy();
    const report = await engine.routeEtsyApi({ method: "GET", path: "/application/shops" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectEtsy();
    const report = engine.handleEtsyEvent({
      topic: "LISTING_UPDATE",
      payloadRef: "payload-ref-etsy-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_event");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectEtsy();
    await engine.routeEtsyApi({ method: "GET", path: "/application/shops/1" });
    await engine.routeEtsyApi({ method: "GET", path: "/application/shops/2" });
    const limited = await engine.routeEtsyApi({ method: "GET", path: "/application/shops/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendEtsyLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-oauth-token bearer abc123",
    });
    engine.connectEtsy();
    const logs = getEtsyLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oauth-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectEtsy();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
  });

  test("getLatestReport returns most recent Etsy connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectEtsy();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
