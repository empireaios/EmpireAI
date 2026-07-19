import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
} from "../../supplier-framework/index.js";
import {
  createAliExpressIntegrationEngine,
  resetAliExpressIntegrationForTesting,
  buildAliExpressIntegrationConfiguration,
  ALIEXPRESS_INTEGRATION_SYSTEM_PATH,
  AEX_CAPABILITIES,
  AEX_SUPPLIER_ID,
} from "../../aliexpress-integration/index.js";
import { appendAexLog, getAexLogs } from "../../aliexpress-integration/aex-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAliExpressIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const sf = createSupplierFrameworkEngine(bootstrap);
  await sf.initialize();
  const engine = createAliExpressIntegrationEngine(bootstrap, sf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, sf };
}

describe("R2-03 AliExpress Integration", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetAliExpressIntegrationForTesting();
  });

  test("buildAliExpressIntegrationConfiguration loads defaults", () => {
    const config = buildAliExpressIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://aliexpress-api");
    assert.ok(AEX_CAPABILITIES.includes("aliexpress_authentication"));
  });

  test("aliexpress integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AEX-001");
    assert.equal(state.missionId, "R2-03");
    assert.ok(ALIEXPRESS_INTEGRATION_SYSTEM_PATH.includes("ALIEXPRESS"));
  });

  test("connectAliExpress registers AliExpress with Supplier Framework via R2-03", async () => {
    const { engine, sf } = await buildEngine();
    const report = engine.connectAliExpress();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const suppliers = sf.getRegisteredSuppliers();
    assert.ok(suppliers.some((s) => s.supplierIdentifier === AEX_SUPPLIER_ID));
  });

  test("connectAliExpress produces machine-readable aex-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAliExpress();
    assert.ok(report.connectorRunReportId.startsWith("aex-run-"));
    assert.ok(report.record.connectorId.startsWith("aex-"));
    assert.equal(report.record.supplierId, "aliexpress");
    assert.equal(report.record.metadataVersion, "AEX-001-v1");
    assert.ok(report.record.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAliExpress({ credentialRef: "vault://aliexpress-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getAexLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectAliExpress();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through AliExpress connector", async () => {
    const { engine } = await buildEngine();
    engine.connectAliExpress();
    const report = await engine.routeAliExpressApi({ method: "GET", path: "/product/list" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectAliExpress();
    const report = engine.handleAliExpressWebhook({
      topic: "order.shipped",
      payloadRef: "webhook-payload-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectAliExpress();
    await engine.routeAliExpressApi({ method: "GET", path: "/product/1" });
    await engine.routeAliExpressApi({ method: "GET", path: "/product/2" });
    const limited = await engine.routeAliExpressApi({ method: "GET", path: "/product/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAexLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-aex-key bearer abc123 token=xyz",
    });
    engine.connectAliExpress();
    const logs = getAexLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-aex-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAliExpress();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectAliExpress();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
