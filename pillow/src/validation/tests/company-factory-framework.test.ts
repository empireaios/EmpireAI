import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCompanyFactoryFrameworkEngine,
  resetCompanyFactoryFrameworkForTesting,
  buildCompanyFactoryFrameworkConfiguration,
  COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../company-factory-framework/index.js";
import type { CompanyModuleDefinition } from "../../company-factory-framework/index.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
} from "../../company-factory-framework/cff-logging.js";

const TEMPLATE_MODULE: CompanyModuleDefinition = {
  companyModuleIdentifier: "company-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  authenticationMethod: "api_key",
  credentialRef: "vault://company-template-alpha",
  apiEndpointConfig: {
    baseUrl: "https://api.example-company-factory.test",
    protocol: "rest",
    timeoutMs: 30000,
    version: "v1",
  },
  eventRoutingConfig: {
    enabled: true,
    topics: ["company.created", "company.lifecycle"],
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
    "company_module_registration",
    "company_module_initialization",
    "company_module_activation",
    "company_event_routing",
    "company_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCompanyFactoryFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("X1-01 Company Factory Framework", () => {
  beforeEach(() => {
    resetCompanyFactoryFrameworkForTesting();
  });

  test("buildCompanyFactoryFrameworkConfiguration loads defaults", () => {
    const config = buildCompanyFactoryFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.isolateModules, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("company_module_registration"));
  });

  test("company factory framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CFF-001");
    assert.equal(state.missionId, "X1-01");
    assert.ok(COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH.includes("COMPANY_FACTORY"));
  });

  test("registerCompanyModule produces machine-readable framework records", async () => {
    const engine = await buildEngine();
    const report = engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.frameworkRunReportId.startsWith("cff-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.frameworkId.startsWith("cff-"));
    assert.equal(record.companyModuleIdentifier, "company-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "CFF-001-v1");
  });

  test("rejects specific company integrations out of X1-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerCompanyModule({
      definition: {
        ...TEMPLATE_MODULE,
        companyModuleIdentifier: "business-opportunity-discovery",
      },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("company module lifecycle register initialize and activate", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activateCompanyModule("company-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    const record = engine.getRegisteredModules()[0];
    assert.equal(record?.operationalState, "active");
  });

  test("company module suspend and shutdown lifecycle", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    engine.activateCompanyModule("company-template-alpha");
    const suspended = engine.suspendCompanyModule("company-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownCompanyModule("company-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("company event routing routes events", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    engine.activateCompanyModule("company-template-alpha");
    const report = engine.routeCompanyEvent({
      companyModuleIdentifier: "company-template-alpha",
      topic: "company.created",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("company data abstraction abstracts company data", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    engine.activateCompanyModule("company-template-alpha");
    const report = engine.abstractCompanyData({
      companyModuleIdentifier: "company-template-alpha",
      dataType: "company_blueprint",
      payloadRef: "company-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("rate limiting blocks excessive company events", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    engine.activateCompanyModule("company-template-alpha");
    engine.routeCompanyEvent({
      companyModuleIdentifier: "company-template-alpha",
      topic: "company.created",
      payloadRef: "payload-1",
    });
    engine.routeCompanyEvent({
      companyModuleIdentifier: "company-template-alpha",
      topic: "company.lifecycle",
      payloadRef: "payload-2",
    });
    const limited = engine.routeCompanyEvent({
      companyModuleIdentifier: "company-template-alpha",
      topic: "company.created",
      payloadRef: "payload-3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendFrameworkLog({
      event: "framework_event",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    const logs = getFrameworkLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerCompanyModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModuleCount, 1);
    const diagnostics = engine.runDiagnostics();
    assert.notEqual(diagnostics.validation.decision, "fail");
  });
});
