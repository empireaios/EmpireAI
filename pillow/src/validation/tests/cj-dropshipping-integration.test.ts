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
  createCjDropshippingIntegrationEngine,
  resetCjDropshippingIntegrationForTesting,
  buildCjDropshippingIntegrationConfiguration,
  CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH,
  CJ_CAPABILITIES,
  CJ_SUPPLIER_ID,
} from "../../cj-dropshipping-integration/index.js";
import { appendCjLog, getCjLogs } from "../../cj-dropshipping-integration/cj-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCjDropshippingIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const sf = createSupplierFrameworkEngine(bootstrap);
  await sf.initialize();
  const engine = createCjDropshippingIntegrationEngine(bootstrap, sf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, sf };
}

describe("R2-02 CJdropshipping Integration", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
    resetCjDropshippingIntegrationForTesting();
  });

  test("buildCjDropshippingIntegrationConfiguration loads defaults", () => {
    const config = buildCjDropshippingIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://cj-dropshipping-api");
    assert.ok(CJ_CAPABILITIES.includes("cj_authentication"));
  });

  test("cjdropshipping integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CJ-001");
    assert.equal(state.missionId, "R2-02");
    assert.ok(CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH.includes("CJDROPSHIPPING"));
  });

  test("connectCjDropshipping registers CJ with Supplier Framework via R2-02", async () => {
    const { engine, sf } = await buildEngine();
    const report = engine.connectCjDropshipping();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const suppliers = sf.getRegisteredSuppliers();
    assert.ok(suppliers.some((s) => s.supplierIdentifier === CJ_SUPPLIER_ID));
  });

  test("connectCjDropshipping produces machine-readable cj-* connector records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectCjDropshipping();
    assert.ok(report.connectorRunReportId.startsWith("cj-run-"));
    assert.ok(report.record.connectorId.startsWith("cj-"));
    assert.equal(report.record.supplierId, "cj-dropshipping");
    assert.equal(report.record.metadataVersion, "CJ-001-v1");
    assert.ok(report.record.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectCjDropshipping({ credentialRef: "vault://cj-dropshipping-api" });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getCjLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectCjDropshipping();
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through CJdropshipping connector", async () => {
    const { engine } = await buildEngine();
    engine.connectCjDropshipping();
    const report = await engine.routeCjApi({ method: "GET", path: "/product/list" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("webhook event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectCjDropshipping();
    const report = engine.handleCjWebhook({
      topic: "order.shipped",
      payloadRef: "webhook-payload-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_webhook");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectCjDropshipping();
    await engine.routeCjApi({ method: "GET", path: "/product/1" });
    await engine.routeCjApi({ method: "GET", path: "/product/2" });
    const limited = await engine.routeCjApi({ method: "GET", path: "/product/3" });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCjLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-cj-key bearer abc123 token=xyz",
    });
    engine.connectCjDropshipping();
    const logs = getCjLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-cj-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCjDropshipping();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectCjDropshipping();
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
