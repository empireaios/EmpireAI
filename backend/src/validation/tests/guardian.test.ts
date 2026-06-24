import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ActionGuard } from "../../guardian/action-guard.js";
import { DatabaseGuardian } from "../../guardian/database-guardian.js";
import { GuardianEngine } from "../../guardian/guardian-engine.js";
import { RecoveryPlanner } from "../../guardian/recovery-planner.js";
import { RiskRegistry } from "../../guardian/risk-registry.js";
import { AuditLogger } from "../../brain/audit/audit-logger.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("Guardian Engine", () => {
  it("blocks empty workspace dispatch", () => {
    const audit = new AuditLogger();
    const guardian = new GuardianEngine(audit);
    const verdict = guardian.assessDispatch({
      module: "dashboard",
      action: "load",
      workspaceId: "   ",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.code, "EMPTY_WORKSPACE");
    assert.ok(verdict.riskId);
    assert.ok(verdict.recoveryPlanId);
  });

  it("blocks destructive payload keys", () => {
    const audit = new AuditLogger();
    const guardian = new GuardianEngine(audit);
    const verdict = guardian.assessDispatch({
      module: "orders",
      action: "load",
      workspaceId: "ws_test",
      payload: { wipe: true },
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.code, "DESTRUCTIVE_PAYLOAD");
  });

  it("blocks high-risk actions without confirmation", () => {
    const audit = new AuditLogger();
    const actionGuard = new ActionGuard(new DatabaseGuardian());
    const verdict = actionGuard.assess({
      module: "store",
      action: "manufacture",
      workspaceId: "ws_test",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.code, "CONFIRMATION_REQUIRED");
  });

  it("allows safe load actions", () => {
    const audit = new AuditLogger();
    const guardian = new GuardianEngine(audit);
    const verdict = guardian.assessDispatch({
      module: "dashboard",
      action: "load",
      workspaceId: "ws_test",
      payload: {},
    });

    assert.equal(verdict.allowed, true);
  });

  it("skips database write guard for read-only load actions", () => {
    const failingDbGuardian = {
      assertSafeForWrite: () => {
        throw new Error("Database guardian blocked write");
      },
    } as unknown as DatabaseGuardian;

    const actionGuard = new ActionGuard(failingDbGuardian);
    const loadVerdict = actionGuard.assess({
      module: "dashboard",
      action: "load",
      workspaceId: "ws_test",
      payload: {},
    });
    assert.equal(loadVerdict.allowed, true);

    const writeVerdict = actionGuard.assess({
      module: "store",
      action: "manufacture",
      workspaceId: "ws_test",
      payload: { confirmed: true },
    });
    assert.equal(writeVerdict.allowed, false);
    assert.equal(writeVerdict.code, "DATABASE_INTEGRITY");
  });

  it("records risks and recovery plans", () => {
    const risks = new RiskRegistry();
    const recovery = new RecoveryPlanner();
    const risk = risks.record({
      severity: "high",
      subsystem: "task-queue",
      code: "REDIS_DOWN",
      message: "Redis unavailable",
    });

    const plan = recovery.createPlan(risk);
    assert.ok(plan.steps.length >= 3);
    assert.ok(plan.rollbackSteps.length >= 1);
    assert.equal(recovery.getForRisk(risk.id)?.id, plan.id);
  });

  it("verifies database integrity", () => {
    const dbGuardian = new DatabaseGuardian();
    const report = dbGuardian.verifyIntegrity();
    assert.equal(report.ok, true);
    assert.equal(report.integrityCheck, "ok");
    assert.equal(report.missingTables.length, 0);
    assert.equal(report.requiredTables.includes("decisions"), true);
  });

  it("allows ai-ceo approve dispatches when database is healthy", () => {
    const audit = new AuditLogger();
    const guardian = new GuardianEngine(audit);
    const verdict = guardian.assessDispatch(
      {
        module: "ai-ceo",
        action: "approve",
        workspaceId: "ws_test",
        payload: { decisionId: "decision-1", founderApproved: true },
      },
      { toolAuthorityLevel: "L2" },
    );

    assert.equal(verdict.allowed, true);
    assert.equal(verdict.code, "ALLOWED");
  });

  it("allows founder signature approve actions without explicit founderApproved flag", () => {
    const actionGuard = new ActionGuard(new DatabaseGuardian());
    const verdict = actionGuard.assess({
      module: "ai-ceo",
      action: "approve",
      workspaceId: "ws_test",
      payload: { decisionId: "decision-1" },
      toolAuthorityLevel: "L3",
    });

    assert.equal(verdict.allowed, true);
    assert.equal(verdict.code, "ALLOWED");
  });
});
