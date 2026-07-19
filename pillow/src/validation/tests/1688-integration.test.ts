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
  createOss1688IntegrationEngine,
  resetOss1688IntegrationForTesting,
  buildOss1688IntegrationConfiguration,
  OSS1688_INTEGRATION_SYSTEM_PATH,
  OSS1688_CAPABILITIES,
  OSS1688_SUPPLIER_ID,
} from "../../1688-integration/index.js";
import { appendOssLog, getOssLogs } from "../../1688-integration/oss-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildOss1688IntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const sf = createSupplierFrameworkEngine(bootstrap);
  await sf.initialize();
  const engine = createOss1688IntegrationEngine(bootstrap, sf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, sf };
}

describe("R2-04 1688 Integration", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetOss1688IntegrationForTesting();
  });

  test("buildOss1688IntegrationConfiguration loads defaults", () => {
    const config = buildOss1688IntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://1688-api");
    assert.ok(OSS1688_CAPABILITIES.includes("1688_authentication"));
  });

  test("1688 integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-1688-001");
    assert.equal(state.missionId, "R2-04");
    assert.ok(OSS1688_INTEGRATION_SYSTEM_PATH.includes("1688"));
  });

  test("connectOss1688 registers 1688 with Supplier Framework via R2-04", async () => {
    const { engine, sf } = await buildEngine();
    const report = engine.connectOss1688();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const suppliers = sf.getRegisteredSuppliers();
    assert.ok(suppliers.some((s) => s.supplierIdentifier === OSS1688_SUPPLIER_ID));
  });

  test("connectOss1688 produces machine-readable oss-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectOss1688();
    assert.ok(report.connectorRunReportId.startsWith("oss-run-"));
    assert.ok(report.record.connectorId.startsWith("oss-"));
    assert.equal(report.record.supplierId, "1688");
    assert.equal(report.record.metadataVersion, "OSS-001-v1");
    assert.ok(report.record.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectOss1688({ credentialRef: "vault://1688-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getOssLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectOss1688();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through 1688 connector", async () => {
    const { engine } = await buildEngine();
    engine.connectOss1688();
    const report = await engine.routeOss1688Api({ method: "GET", path: "/product/list" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectOss1688();
    const report = engine.handleOss1688Webhook({
      topic: "order.shipped",
      payloadRef: "webhook-payload-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectOss1688();
    await engine.routeOss1688Api({ method: "GET", path: "/product/1" });
    await engine.routeOss1688Api({ method: "GET", path: "/product/2" });
    const limited = await engine.routeOss1688Api({ method: "GET", path: "/product/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendOssLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-oss-key bearer abc123 token=xyz",
    });
    engine.connectOss1688();
    const logs = getOssLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oss-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectOss1688();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectOss1688();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
