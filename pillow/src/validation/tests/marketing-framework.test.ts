import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketingFrameworkEngine,
  resetMarketingFrameworkForTesting,
  buildMarketingFrameworkConfiguration,
  MARKETING_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../marketing-framework/index.js";
import type { MarketingModuleDefinition } from "../../marketing-framework/index.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
} from "../../marketing-framework/mfw-logging.js";

const TEMPLATE_MODULE: MarketingModuleDefinition = {
  marketingModuleIdentifier: "marketing-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  authenticationMethod: "api_key",
  credentialRef: "vault://marketing-template-alpha",
  apiEndpointConfig: {
    baseUrl: "https://api.example-marketing.test",
    protocol: "rest",
    timeoutMs: 30000,
    version: "v1",
  },
  eventRoutingConfig: {
    enabled: true,
    topics: ["campaign.created", "audience.updated"],
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
    "marketing_module_registration",
    "marketing_module_initialization",
    "marketing_module_activation",
    "marketing_event_routing",
    "marketing_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMarketingFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("R5-01 Marketing Framework", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
  });

  test("buildMarketingFrameworkConfiguration loads defaults", () => {
    const config = buildMarketingFrameworkConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.isolateModules, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("marketing_module_registration"));
  });

  test("marketing framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MFW-001");
    assert.equal(state.missionId, "R5-01");
    assert.ok(MARKETING_FRAMEWORK_SYSTEM_PATH.includes("MARKETING_FRAMEWORK"));
  });

  test("registerMarketingModule produces machine-readable marketing framework records", async () => {
    const engine = await buildEngine();
    const report = engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.frameworkRunReportId.startsWith("mfw-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.frameworkId.startsWith("mfw-"));
    assert.equal(record.marketingModuleIdentifier, "marketing-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "MFW-001-v1");
  });

  test("rejects specific marketing integrations out of R5-01 scope", async () => {
    const engine = await buildEngine();
    const report = engine.registerMarketingModule({
      definition: { ...TEMPLATE_MODULE, marketingModuleIdentifier: "meta-ads-integration" },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope")));
  });

  test("marketing module lifecycle register initialize and activate", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activateMarketingModule("marketing-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    const record = engine.getRegisteredModules()[0];
    assert.equal(record?.operationalState, "active");
  });

  test("marketing module suspend and shutdown lifecycle", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    engine.activateMarketingModule("marketing-template-alpha");
    const suspended = engine.suspendMarketingModule("marketing-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownMarketingModule("marketing-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("marketing event routing routes events", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    engine.activateMarketingModule("marketing-template-alpha");
    const report = engine.routeMarketingEvent({
      marketingModuleIdentifier: "marketing-template-alpha",
      topic: "campaign.created",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("marketing data abstraction abstracts marketing data", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    engine.activateMarketingModule("marketing-template-alpha");
    const report = engine.abstractMarketingData({
      marketingModuleIdentifier: "marketing-template-alpha",
      dataType: "campaign_record",
      payloadRef: "campaign-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("rate limiting blocks excessive marketing events", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    engine.activateMarketingModule("marketing-template-alpha");
    await engine.routeMarketingEvent({
      marketingModuleIdentifier: "marketing-template-alpha",
      topic: "campaign.created",
      payloadRef: "payload-1",
    });
    await engine.routeMarketingEvent({
      marketingModuleIdentifier: "marketing-template-alpha",
      topic: "audience.updated",
      payloadRef: "payload-2",
    });
    const limited = await engine.routeMarketingEvent({
      marketingModuleIdentifier: "marketing-template-alpha",
      topic: "campaign.created",
      payloadRef: "payload-3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendFrameworkLog({
      event: "marketing_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 ad_account=12345",
    });
    await engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    const logs = getFrameworkLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerMarketingModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModuleCount, 1);
    const diagnostics = engine.runDiagnostics();
    assert.notEqual(diagnostics.validation.decision, "fail");
  });
});
