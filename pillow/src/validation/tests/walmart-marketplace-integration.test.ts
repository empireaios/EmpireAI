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
  createWalmartMarketplaceIntegrationEngine,
  resetWalmartMarketplaceIntegrationForTesting,
  buildWalmartMarketplaceIntegrationConfiguration,
  WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  WALMART_CAPABILITIES,
  WALMART_MARKETPLACE_ID,
} from "../../walmart-marketplace-integration/index.js";
import { appendWalmartLog, getWalmartLogs } from "../../walmart-marketplace-integration/wmt-logging.js";

async function buildEngine(configOverrides?: Parameters<typeof buildWalmartMarketplaceIntegrationConfiguration>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createWalmartMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-06 Walmart Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetWalmartMarketplaceIntegrationForTesting();
  });

  test("buildWalmartMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildWalmartMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://walmart-marketplace-api");
    assert.ok(WALMART_CAPABILITIES.includes("walmart_authentication"));
  });

  test("walmart marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-WMT-001");
    assert.equal(state.missionId, "R1-06");
    assert.ok(WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("WALMART_MARKETPLACE"));
  });

  test("connectWalmart registers Walmart with MCF via R1-06", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectWalmart();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === WALMART_MARKETPLACE_ID));
  });

  test("connectWalmart produces machine-readable wmt-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWalmart();
    assert.ok(report.connectorRunReportId.startsWith("wmt-run-"));
    assert.ok(report.record.connectorId.startsWith("wmt-"));
    assert.equal(report.record.marketplaceId, "walmart");
    assert.equal(report.record.metadataVersion, "WMT-001-v1");
    assert.ok(report.record.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWalmart({ credentialRef: "vault://walmart-marketplace-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getWalmartLogs(50);
    assert.ok(!logs.some((l) => /bearer|oauth_token|client_secret/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectWalmart();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through Walmart connector", async () => {
    const { engine } = await buildEngine();
    engine.connectWalmart();
    const report = await engine.routeWalmartApi({ method: "GET", path: "/v3/items" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectWalmart();
    await engine.routeWalmartApi({ method: "GET", path: "/v3/items/1" });
    await engine.routeWalmartApi({ method: "GET", path: "/v3/items/2" });
    const limited = await engine.routeWalmartApi({ method: "GET", path: "/v3/items/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendWalmartLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-oauth-token bearer abc123",
    });
    engine.connectWalmart();
    const logs = getWalmartLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oauth-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectWalmart();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
  });

  test("getLatestReport returns most recent Walmart connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectWalmart();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
