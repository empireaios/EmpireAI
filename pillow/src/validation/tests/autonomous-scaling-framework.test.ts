import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createAutonomousScalingFrameworkEngine,
  resetAutonomousScalingFrameworkForTesting,
  buildAutonomousScalingFrameworkConfiguration,
  AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH,
  FRAMEWORK_CAPABILITIES,
} from "../../autonomous-scaling-framework/index.js";
import type { ScalingModuleDefinition } from "../../autonomous-scaling-framework/index.js";
import {
  appendAsfLog,
  getAsfLogs,
} from "../../autonomous-scaling-framework/asf-logging.js";

const TEMPLATE_MODULE: ScalingModuleDefinition = {
  scalingModuleIdentifier: "scaling-template-alpha",
  moduleVersion: "1.0.0",
  moduleType: "template",
  eventRoutingConfig: {
    enabled: true,
    topics: ["scaling.module.registered", "scaling.lifecycle"],
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
    "scaling_module_registration",
    "scaling_lifecycle_management",
    "scaling_event_routing",
    "scaling_data_abstraction",
  ],
};

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAutonomousScalingFrameworkEngine(bootstrap);
  await engine.initialize();
  return engine;
}

describe("X3-01 Autonomous Scaling Framework", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
  });

  test("buildAutonomousScalingFrameworkConfiguration locks safety flags", () => {
    const config = buildAutonomousScalingFrameworkConfiguration(REPO_ROOT, {
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
    assert.ok(FRAMEWORK_CAPABILITIES.includes("scaling_module_registration"));
  });

  test("autonomous scaling framework initializes with doctrine doc", async () => {
    const engine = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ASF-001");
    assert.equal(state.missionId, "X3-01");
    assert.ok(AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH.includes("AUTONOMOUS_SCALING"));
  });

  test("registerScalingModule produces asf-* machine-readable records", async () => {
    const engine = await buildEngine();
    const report = engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.scalingFrameworkRunReportId.startsWith("asf-run-"));
    assert.equal(report.records.length, 1);
    const record = report.records[0]!;
    assert.ok(record.scalingFrameworkId.startsWith("asf-"));
    assert.equal(record.scalingModuleIdentifier, "scaling-template-alpha");
    assert.equal(record.operationalState, "initialized");
    assert.equal(record.metadataVersion, "ASF-001-v1");
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.bypassedValidation, false);
  });

  test("rejects reserved scaling modules without matching integrationMissionId", async () => {
    const engine = await buildEngine();
    const report = engine.registerScalingModule({
      definition: {
        ...TEMPLATE_MODULE,
        scalingModuleIdentifier: "winning-product-detector",
      },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("out of scope for X3-01")));
  });

  test("accepts reserved scaling module WITH matching integrationMissionId", async () => {
    const engine = await buildEngine();
    const report = engine.registerScalingModule({
      definition: {
        ...TEMPLATE_MODULE,
        scalingModuleIdentifier: "winning-product-detector",
        moduleType: "integration",
        integrationMissionId: "X3-02",
      },
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.records[0]?.scalingModuleIdentifier, "winning-product-detector");
  });

  test("scaling module lifecycle activate suspend and shutdown", async () => {
    const engine = await buildEngine();
    engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    const activated = engine.activateScalingModule("scaling-template-alpha");
    assert.notEqual(activated.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "active");
    const suspended = engine.suspendScalingModule("scaling-template-alpha");
    assert.notEqual(suspended.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "suspended");
    const shutdown = engine.shutdownScalingModule("scaling-template-alpha");
    assert.notEqual(shutdown.validation.decision, "fail");
    assert.equal(engine.getRegisteredModules()[0]?.operationalState, "shutdown");
  });

  test("routeScalingEvent works after activate", async () => {
    const engine = await buildEngine();
    engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    engine.activateScalingModule("scaling-template-alpha");
    const report = engine.routeScalingEvent({
      scalingModuleIdentifier: "scaling-template-alpha",
      topic: "scaling.module.registered",
      payloadRef: "payload-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_event");
  });

  test("abstractScalingData works", async () => {
    const engine = await buildEngine();
    engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    engine.activateScalingModule("scaling-template-alpha");
    const report = engine.abstractScalingData({
      scalingModuleIdentifier: "scaling-template-alpha",
      dataType: "scaling_blueprint",
      payloadRef: "scaling-ref-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "abstract_data");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const engine = await buildEngine();
    appendAsfLog({
      event: "scaling_event",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    const logs = getAsfLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const engine = await buildEngine();
    engine.registerScalingModule({ definition: TEMPLATE_MODULE });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.registeredModules, 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });
});
