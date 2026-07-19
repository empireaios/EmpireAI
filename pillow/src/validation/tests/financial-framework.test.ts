import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createFinancialFrameworkEngine,
  resetFinancialFrameworkForTesting,
  buildFinancialFrameworkConfiguration,
  FINANCIAL_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../financial-framework/index.js";
import type { FinancialModuleDefinition } from "../../financial-framework/index.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
} from "../../financial-framework/ff-logging.js";

const TEMPLATE_MODULE: FinancialModuleDefinition = {
  financialModuleIdentifier: "financial-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  authenticationMethod: "api_key",
  credentialRef: "vault://financial-template-alpha",
  apiEndpointConfig: {
    baseUrl: "https://api.example-finance.test",
    protocol: "rest",
    timeoutMs: 30000,
    version: "v1",
  },
  eventRoutingConfig: {
    enabled: true,
    topics: ["transaction.posted", "ledger.updated"],
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
    "financial_module_registration",
    "financial_module_initialization",
    "financial_module_activation",
    "financial_event_routing",
    "financial_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createFinancialFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("R3-01 Financial Framework", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
  });

  test("buildFinancialFrameworkConfiguration loads defaults", () => {
    const config = buildFinancialFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.isolateModules, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("financial_module_registration"));
  });

  test("financial framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FF-001");
    assert.equal(state.missionId, "R3-01");
    assert.ok(FINANCIAL_FRAMEWORK_SYSTEM_PATH.includes("FINANCIAL_FRAMEWORK"));
  });

  test("registerFinancialModule produces machine-readable financial framework records", async () => {
    const engine = await buildEngine();
    const report = engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.frameworkRunReportId.startsWith("ff-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.frameworkId.startsWith("ff-"));
    assert.equal(record.financialModuleIdentifier, "financial-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "FF-001-v1");
  });

  test("rejects specific financial integrations out of R3-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerFinancialModule({
      definition: { ...TEMPLATE_MODULE, financialModuleIdentifier: "payment-gateway" },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("financial module lifecycle register initialize and activate", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activateFinancialModule("financial-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    const record = engine.getRegisteredModules()[0];
    assert.equal(record?.operationalState, "active");
  });

  test("financial module suspend and shutdown lifecycle", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    engine.activateFinancialModule("financial-template-alpha");
    const suspended = engine.suspendFinancialModule("financial-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownFinancialModule("financial-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("financial event routing routes events", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    engine.activateFinancialModule("financial-template-alpha");
    const report = engine.routeFinancialEvent({
      financialModuleIdentifier: "financial-template-alpha",
      topic: "transaction.posted",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("financial data abstraction abstracts financial data", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    engine.activateFinancialModule("financial-template-alpha");
    const report = engine.abstractFinancialData({
      financialModuleIdentifier: "financial-template-alpha",
      dataType: "ledger_entry",
      payloadRef: "ledger-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("rate limiting blocks excessive financial events", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    engine.activateFinancialModule("financial-template-alpha");
    await engine.routeFinancialEvent({
      financialModuleIdentifier: "financial-template-alpha",
      topic: "transaction.posted",
      payloadRef: "payload-1",
    });
    await engine.routeFinancialEvent({
      financialModuleIdentifier: "financial-template-alpha",
      topic: "ledger.updated",
      payloadRef: "payload-2",
    });
    const limited = await engine.routeFinancialEvent({
      financialModuleIdentifier: "financial-template-alpha",
      topic: "transaction.posted",
      payloadRef: "payload-3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendFrameworkLog({
      event: "financial_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 account_number=12345",
    });
    await engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    const logs = getFrameworkLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerFinancialModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModuleCount, 1);
    const diagnostics = engine.runDiagnostics();
    assert.notEqual(diagnostics.validation.decision, "fail");
  });
});
