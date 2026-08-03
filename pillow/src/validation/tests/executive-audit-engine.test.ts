import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_TYPES,
  EXA_CAPABILITIES,
  SEVERITY_LEVELS,
  buildExecutiveAuditEngineConfiguration,
  createExecutiveAuditEngine,
  resetExecutiveAuditEngineForTesting,
} from "../../executive-audit-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExecutiveAuditEngine(bootstrap);
  await engine.initialize();
  engine.connectExecutiveAuditEngine();
  return engine;
}

describe("Q0-08 Executive Audit Engine", () => {
  beforeEach(resetExecutiveAuditEngineForTesting);

  test("1 locks mandatory executive-audit boundaries", () => {
    const c = buildExecutiveAuditEngineConfiguration(REPO_ROOT, {
      neverExecuteCorrections: false as never,
      neverApproveMissions: false as never,
      neverAssignWorkers: false as never,
      neverModifyBusinessState: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteCorrections, true);
    assert.equal(c.neverApproveMissions, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverModifyBusinessState, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-EXA-001 for Q0-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-08");
    assert.equal(state.engineVersion, "PILLOW-EXA-001");
    for (const type of AUDIT_TYPES) {
      assert.ok(state.configuration.auditTypes.includes(type));
    }
    assert.ok(SEVERITY_LEVELS.includes("critical"));
  });

  test("3 audits an executive decision", async () => {
    const report = (await build()).auditExecutiveDecision({
      objectId: "de-dec-100",
      targetObject: "executive_decision",
      decisionHints: ["Decision package recommends phased rollout with confidence 72"],
      evidenceHints: ["structural://decision-package/de-dec-100"],
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const audit = report.reports[0]!;
    assert.equal(audit.auditType, "decision_audit");
    assert.equal(audit.objectId, "de-dec-100");
    assert.ok(audit.findings.length > 0);
    assert.equal(audit.correctionsExecuted, false);
  });

  test("4 audits a mission output", async () => {
    const audit = (await build()).auditMissionOutput({
      objectId: "msn-42",
      targetObject: "mission_output",
      missionHints: ["Mission produced structured plan without execution claims"],
      validated: true,
    }).reports[0]!;
    assert.equal(audit.auditType, "mission_audit");
    assert.equal(audit.auditStatus, "passed");
    assert.ok(audit.recommendations.length > 0);
  });

  test("5 audits a workforce action", async () => {
    const audit = (await build()).auditWorkforceAction({
      objectId: "wf-act-9",
      targetObject: "workforce_action",
      workforceHints: ["Workforce category identified for operations stage"],
      validated: true,
    }).reports[0]!;
    assert.equal(audit.auditType, "workforce_audit");
    assert.equal(audit.workersAssigned, false);
  });

  test("6 detects a governance violation and fails the audit", async () => {
    const audit = (await build()).auditGovernance({
      objectId: "gov-1",
      governanceHints: ["Action proceeded without approval and attempted to bypass governance"],
      violationHints: ["Unauthorized execution path"],
      validated: true,
    }).reports[0]!;
    assert.equal(audit.auditType, "governance_audit");
    assert.ok(audit.violations.length > 0);
    assert.ok(audit.auditStatus === "failed" || audit.auditStatus === "warning");
    assert.ok(["critical", "high", "medium"].includes(audit.severity));
    assert.ok(audit.correctiveActions.some((a) => a.toLowerCase().includes("will not execute")));
  });

  test("7 produces machine-readable audit reports with required fields", async () => {
    const audit = (await build()).runAudit({
      auditType: "approval_audit",
      objectId: "ar-apr-1",
      targetObject: "approval_request",
      approvalHints: ["Pending Grand King approval blocks execution"],
      validated: true,
    }).reports[0]!;
    assert.ok(audit.auditId.startsWith("exa-aud-"));
    assert.equal(audit.metadataVersion, "EXA-001-v1");
    assert.ok(audit.evidence.length > 0);
    assert.ok(audit.correctiveActions.length > 0);
    assert.equal(audit.neverExecuteCorrections, true);
    assert.equal(audit.neverModifyBusinessState, true);
  });

  test("8 rejects execute / approve / assign / modify / override boundary violations", async () => {
    const engine = await build();
    const base = {
      objectId: "x-1",
      summary: "Boundary probe",
      validated: true as const,
    };
    assert.equal(engine.runAudit({ ...base, executeCorrections: true }).validation.decision, "fail");
    assert.equal(engine.runAudit({ ...base, approveMissions: true }).validation.decision, "fail");
    assert.equal(engine.runAudit({ ...base, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.runAudit({ ...base, modifyBusinessState: true }).validation.decision, "fail");
    assert.equal(engine.runAudit({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.runAudit({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports memory, business, recommendation audits and extensible types", async () => {
    const engine = createExecutiveAuditEngine(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { auditTypes: [...AUDIT_TYPES, "portfolio_audit"] } },
    );
    await engine.initialize();
    engine.connectExecutiveAuditEngine();
    assert.ok(
      engine.auditExecutionMemory({
        objectId: "exm-1",
        memoryHints: ["Memory record hash intact"],
        validated: true,
      }).reports[0]!.auditType === "memory_audit",
    );
    assert.ok(
      engine.auditBusinessState({
        objectId: "bsm-1",
        businessHints: ["Business lifecycle consistent"],
        validated: true,
      }).reports[0]!.auditType === "business_audit",
    );
    const quality = engine.auditRecommendationQuality({
      objectId: "rec-1",
      recommendationHints: ["Recommendation includes rationale and confidence"],
      validated: true,
    }).reports[0]!;
    assert.ok(quality.findings.some((f) => f.toLowerCase().includes("recommendation")));
    assert.ok(engine.getState().configuration.auditTypes.includes("portfolio_audit"));
    assert.ok(EXA_CAPABILITIES.includes("extensible_audit_types"));
  });

  test("10 validates stored audit reports", async () => {
    const engine = await build();
    engine.auditExecutiveDecision({
      objectId: "de-dec-200",
      decisionHints: ["Decision remains advisory only"],
      validated: true,
    });
    const validation = engine.validateAudits({ validated: true, summary: "revalidate" });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getReports().length, 1);
    assert.equal(engine.getLatestAuditReport()?.neverApproveMissions, true);
  });
});
