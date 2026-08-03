import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createGlobalExpansionFrameworkEngine,
  resetGlobalExpansionFrameworkForTesting,
  buildGlobalExpansionFrameworkConfiguration,
  GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../global-expansion-framework/index.js";
import type { ExpansionModuleDefinition } from "../../global-expansion-framework/index.js";
import {
  appendGefLog,
  getGefLogs,
} from "../../global-expansion-framework/gef-logging.js";

const TEMPLATE_MODULE: ExpansionModuleDefinition = {
  expansionModuleIdentifier: "expansion-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  eventRoutingConfig: {
    enabled: true,
    topics: ["expansion.module.registered", "expansion.lifecycle"],
    maxEventsPerMinute: 2,
    windowMs: 60000,
  },
  retryConfig: {
    enabled: true,
    maxAttempts: 3,
    delayMs: 10,
    backoffMultiplier: 2,
  },
  supportedCapabilities: [
    "global_expansion_module_registration",
    "international_expansion_lifecycle_management",
    "global_expansion_event_routing",
    "regional_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createGlobalExpansionFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("X4-01 Global Expansion Framework", () => {
  beforeEach(() => {
    resetGlobalExpansionFrameworkForTesting();
  });

  test("buildGlobalExpansionFrameworkConfiguration locks safety flags", () => {
    const config = buildGlobalExpansionFrameworkConfiguration(REPO_ROOT, {
      neverExposeCredentials: false as never,
      neverBypassValidation: false as never,
      preserveModuleIsolation: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.preserveModuleIsolation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.neverBypassValidation, true);
    assert.equal(config.preserveAuditability, true);
    assert.equal(config.preserveRecoveryCapability, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(FRAMEWORK_CAPABILITIES.includes("global_expansion_module_registration"));
  });

  test("global expansion framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GEF-001");
    assert.equal(state.missionId, "X4-01");
    assert.ok(GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH.includes("GLOBAL_EXPANSION"));
  });

  test("registerExpansionModule produces gef-* machine-readable records", async () => {
    const engine = await buildEngine();
    const report = engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.expansionFrameworkRunReportId.startsWith("gef-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.expansionFrameworkId.startsWith("gef-"));
    assert.equal(record.expansionModuleIdentifier, "expansion-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "GEF-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.bypassedValidation, false);
  });

  test("rejects reserved expansion modules without matching integrationMissionId", async () => {
    const engine = await buildEngine();
    const report = engine.registerExpansionModule({
      definition: {
        ...TEMPLATE_MODULE,
        expansionModuleIdentifier: "country-intelligence-engine",
      },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope for X4-01")));
  });

  test("accepts reserved expansion module WITH matching integrationMissionId", async () => {
    const engine = await buildEngine();
    const report = engine.registerExpansionModule({
      definition: {
        ...TEMPLATE_MODULE,
        expansionModuleIdentifier: "country-intelligence-engine",
        moduleType: "integration",
        integrationMissionId: "X4-02",
      },
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.records[0]?.expansionModuleIdentifier, "country-intelligence-engine");
  });

  test("expansion module lifecycle activate suspend and shutdown", async () => {
    const engine = await buildEngine();
    engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activateExpansionModule("expansion-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "active");
    const suspended = engine.suspendExpansionModule("expansion-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownExpansionModule("expansion-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("routeExpansionEvent works after activate", async () => {
    const engine = await buildEngine();
    engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    engine.activateExpansionModule("expansion-template-alpha");
    const report = engine.routeExpansionEvent({
      expansionModuleIdentifier: "expansion-template-alpha",
      topic: "expansion.module.registered",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("abstractRegionalData works", async () => {
    const engine = await buildEngine();
    engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    engine.activateExpansionModule("expansion-template-alpha");
    const report = engine.abstractRegionalData({
      expansionModuleIdentifier: "expansion-template-alpha",
      dataType: "regional_blueprint",
      payloadRef: "regional-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendGefLog({
      event: "expansion_event",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    const logs = getGefLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerExpansionModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModules, 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });
});
