import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createSupplierFrameworkEngine,
  resetSupplierFrameworkForTesting,
  buildSupplierFrameworkConfiguration,
  SUPPLIER_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../supplier-framework/index.js";
import type { SupplierConnectorDefinition } from "../../supplier-framework/index.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
} from "../../supplier-framework/sf-logging.js";

const TEMPLATE_SUPPLIER: SupplierConnectorDefinition = {
  supplierIdentifier: "supplier-template-alpha",
  connectorVersion: "1.0.0",
  connectorType: "template",
  authenticationMethod: "api_key",
  credentialRef: "vault://supplier-template-alpha",
  apiEndpointConfig: {
    baseUrl: "https://api.example-supplier.test",
    protocol: "rest",
    timeoutMs: 30000,
    version: "v1",
  },
  eventRoutingConfig: {
    enabled: true,
    topics: ["product.updated", "inventory.changed"],
    maxEventsPerMinute: 2,
    windowMs: 60000,
  },
  rateLimitConfig: {
    enabled: true,
    requestsPerMinute: 2,
    burstLimit: 2,
    windowMs: 60000,
  },
  retryConfig: {
    enabled: true,
    maxAttempts: 3,
    delayMs: 10,
    backoffMultiplier: 2,
  },
  supportedCapabilities: [
    "supplier_registration",
    "supplier_initialization",
    "supplier_activation",
    "supplier_event_routing",
    "supplier_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSupplierFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("R2-01 Supplier Framework", () => {
  beforeEach(() => {
    resetSupplierFrameworkForTesting();
  });

  test("buildSupplierFrameworkConfiguration loads defaults", () => {
    const config = buildSupplierFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.isolateSuppliers, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("supplier_registration"));
  });

  test("supplier framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SF-001");
    assert.equal(state.missionId, "R2-01");
    assert.ok(SUPPLIER_FRAMEWORK_SYSTEM_PATH.includes("SUPPLIER_FRAMEWORK"));
  });

  test("registerSupplier produces machine-readable supplier framework records", async () => {
    const engine = await buildEngine();
    const report = engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.frameworkRunReportId.startsWith("sf-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.frameworkId.startsWith("sf-"));
    assert.equal(record.supplierIdentifier, "supplier-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "SF-001-v1");
  });

  test("rejects specific supplier integrations out of R2-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerSupplier({
      definition: { ...TEMPLATE_SUPPLIER, supplierIdentifier: "cj-dropshipping" },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("supplier lifecycle register initialize and activate", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    const activated = engine.activateSupplier("supplier-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    const record = engine.getRegisteredSuppliers()[0];
    assert.equal(record?.operationalState, "active");
  });

  test("supplier suspend and shutdown lifecycle", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    engine.activateSupplier("supplier-template-alpha");
    const suspended = engine.suspendSupplier("supplier-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredSuppliers()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownSupplier("supplier-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredSuppliers()[0]?.operationalState, "shutdown");
  });

  test("supplier event routing routes events", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    engine.activateSupplier("supplier-template-alpha");
    const report = engine.routeSupplierEvent({
      supplierIdentifier: "supplier-template-alpha",
      topic: "product.updated",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("supplier data abstraction abstracts supplier data", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    engine.activateSupplier("supplier-template-alpha");
    const report = engine.abstractSupplierData({
      supplierIdentifier: "supplier-template-alpha",
      dataType: "product_catalog",
      payloadRef: "catalog-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("rate limiting blocks excessive supplier events", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    engine.activateSupplier("supplier-template-alpha");
    await engine.routeSupplierEvent({
      supplierIdentifier: "supplier-template-alpha",
      topic: "product.updated",
      payloadRef: "payload-1",
    });
    await engine.routeSupplierEvent({
      supplierIdentifier: "supplier-template-alpha",
      topic: "inventory.changed",
      payloadRef: "payload-2",
    });
    const limited = await engine.routeSupplierEvent({
      supplierIdentifier: "supplier-template-alpha",
      topic: "product.updated",
      payloadRef: "payload-3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendFrameworkLog({
      event: "supplier_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 token=xyz",
    });
    await engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    const logs = getFrameworkLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredSupplierCount, 1);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent framework operation", async () => {
    const engine = await buildEngine();
    const report = engine.registerSupplier({ definition: TEMPLATE_SUPPLIER });
    const latest = engine.getLatestReport();
    assert.equal(latest?.frameworkRunReportId, report.frameworkRunReportId);
  });
});
