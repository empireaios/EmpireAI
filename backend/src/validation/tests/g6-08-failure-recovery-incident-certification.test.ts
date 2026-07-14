import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listGuardianRecoveryEvents, notifyGuardianRecoveryEvent } from "../../orchestration/business-automation/guardian/guardian-recovery-bridge.js";
import {
  FAILURE_RECOVERY_EKLS_KINDS,
  FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION,
  FAILURE_RECOVERY_RESULT_STATES,
  buildCockpitFailureRecoveryView,
  createProductionCertificationModuleContract,
  failureRecoveryTools,
  getFailureRecoveryOverview,
  listFailureRecoveryEklsKinds,
  registerFailureRecoveryPlugin,
  resetProductionCertificationHarnessForTests,
  resolveFailureRecoveryRules,
  runFailureRecoveryScan,
  searchFailureRecoveryEklsObservations,
  validateFailureRecoveryPillowGovernance,
  validateGuardianIntegration,
  validateRecoveryPath,
  validateRollbackPath,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureFailureRecoveryTestEnvironment(): void {
  process.env.FRI_MISSING_RECOVERY_PATH = "false";
  process.env.FRI_MISSING_ROLLBACK_PATH = "false";
  process.env.FRI_MISSING_INCIDENT_CLASSIFICATION = "false";
  process.env.FRI_MISSING_ESCALATION_ROUTE = "false";
  process.env.FRI_MISSING_GUARDIAN_EVENT = "false";
  process.env.FRI_MISSING_EKLS_EVIDENCE = "false";
  process.env.FRI_UNSAFE_RETRY = "false";
  process.env.FRI_UNSAFE_ROLLBACK = "false";
  process.env.FRI_UNRECOVERABLE_NO_ESCALATION = "false";
  process.env.FRI_SILENT_FAILURE = "false";
  process.env.FRI_UNREPORTED_FAILURE = "false";
  process.env.FRI_MANUAL_INTERVENTION = "false";
}

describe("G6-08 — Failure, Recovery & Incident Certification", () => {
  it("exposes failure recovery certification version and result states", () => {
    assert.equal(FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION, "g6-08-v1");
    assert.ok(FAILURE_RECOVERY_RESULT_STATES.includes("pass"));
    assert.ok(FAILURE_RECOVERY_RESULT_STATES.includes("fail"));
    assert.equal(FAILURE_RECOVERY_RESULT_STATES.length, 5);
  });

  it("retains G6-08 failure recovery subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.failure_recovery_scan"));
  });

  it("resolves failure recovery rules from REG-CERTIFICATION-FAILURE-RECOVERY", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const rules = resolveFailureRecoveryRules(TEST_CONTEXT);
    assert.ok(rules.length >= 15);
    assert.ok(rules.some((rule) => rule.ruleKind === "failure_detection"));
    assert.ok(rules.some((rule) => rule.ruleKind === "guardian_event_capture"));
    assert.ok(rules.some((rule) => rule.recoveryPathRef !== undefined));
  });

  it("validates recovery and rollback paths via registry-driven rules", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const rules = resolveFailureRecoveryRules(TEST_CONTEXT);
    assert.equal(validateRecoveryPath(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateRollbackPath(rules, TEST_CONTEXT).blockers.length, 0);
  });

  it("validates Guardian event capture without redesigning Guardian", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    notifyGuardianRecoveryEvent({
      eventKind: "failure",
      workspaceId: TEST_ACTOR.workspaceId,
      executionId: "exec-test",
      recoveryId: "rec-test",
      correlationId: "corr-test",
      message: "Certification probe failure event",
    });
    const events = listGuardianRecoveryEvents(TEST_ACTOR.workspaceId);
    assert.ok(events.length >= 1);
    const rules = resolveFailureRecoveryRules(TEST_CONTEXT);
    assert.equal(validateGuardianIntegration(rules, TEST_CONTEXT).blockers.length, 0);
  });

  it("registers all required failure recovery Brain tools", () => {
    const names = new Set(failureRecoveryTools.map((tool) => tool.name));
    for (const toolName of [
      "failure_recovery_overview",
      "failure_recovery_scan",
      "incident_status",
      "incident_risk_register",
      "recovery_path_validation",
      "rollback_path_validation",
      "failure_recovery_recommendations",
      "failure_recovery_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for failure recovery operations", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const result = validateFailureRecoveryPillowGovernance({
      ...TEST_ACTOR,
      operation: "failure_recovery_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.incidentCertificationAuthority, true);
    assert.equal(result.recoveryAuthority, true);
    assert.equal(result.rollbackAuthority, true);
    assert.equal(result.escalationAuthority, true);
    assert.equal(result.evidenceIntegrity, true);
  });

  it("runs failure recovery scan with recovery and rollback readiness", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const scan = runFailureRecoveryScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(scan.status));
    assert.equal(scan.recoveryReadiness.recoveryPathsReady, true);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-FAILURE-RECOVERY");

    const overview = getFailureRecoveryOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records failure recovery EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    assert.deepEqual(listFailureRecoveryEklsKinds(), [...FAILURE_RECOVERY_EKLS_KINDS]);
    runFailureRecoveryScan(TEST_ACTOR);

    const search = searchFailureRecoveryEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "failure_recovery_scan_completed",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit failure recovery backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const scan = runFailureRecoveryScan(TEST_ACTOR);
    const overview = getFailureRecoveryOverview(TEST_CONTEXT);
    const view = buildCockpitFailureRecoveryView({ overview, scan });
    assert.equal(view.viewId, "cockpit-failure-recovery-incident");
    assert.equal(view.certificationStatus, scan.status);
    assert.ok(view.recommendations.length >= 1);
  });

  it("supports failure recovery validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const registered = registerFailureRecoveryPlugin({
      manifest: {
        pluginId: "test-failure-recovery-plugin",
        pluginName: "Test Failure Recovery Plugin",
        validatorKind: "failure",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-failure-recovery-plugin",
        validatorKind: "failure",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runFailureRecoveryScan(TEST_ACTOR);
  });

  it("runs failure recovery scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const tool = failureRecoveryTools.find((entry) => entry.name === "failure_recovery_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-08" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for failure recovery scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-failure-recovery-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("detects blockers when recovery path is missing", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    process.env.FRI_MISSING_RECOVERY_PATH = "true";
    const scan = runFailureRecoveryScan(TEST_ACTOR);
    assert.ok(scan.blockers.length >= 1 || scan.warnings.length >= 1);
    process.env.FRI_MISSING_RECOVERY_PATH = "false";
  });

  it("does not expose credentials or sensitive incident payloads", () => {
    resetProductionCertificationHarnessForTests();
    configureFailureRecoveryTestEnvironment();
    const scan = runFailureRecoveryScan(TEST_ACTOR);
    const serialized = JSON.stringify(scan);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
