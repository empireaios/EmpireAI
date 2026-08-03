import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AR_CAPABILITIES,
  APPROVAL_LEVELS,
  APPROVAL_STATES,
  buildApprovalRouterConfiguration,
  createApprovalRouter,
  resetApprovalRouterForTesting,
} from "../../approval-router/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createApprovalRouter(bootstrap);
  await engine.initialize();
  engine.connectApprovalRouter();
  return engine;
}

describe("Q0-06 Approval Router", () => {
  beforeEach(resetApprovalRouterForTesting);

  test("1 locks mandatory approval-router boundaries", () => {
    const c = buildApprovalRouterConfiguration(REPO_ROOT, {
      neverApproveRequests: false as never,
      neverExecuteRequests: false as never,
      neverAssignWorkers: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverApproveRequests, true);
    assert.equal(c.neverExecuteRequests, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-AR-001 for Q0-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-06");
    assert.equal(state.engineVersion, "PILLOW-AR-001");
    assert.ok(APPROVAL_LEVELS.includes("grand_king_approval"));
    assert.ok(APPROVAL_STATES.includes("pending"));
  });

  test("3 routes an autonomous action with execution allowed", async () => {
    const report = (await build()).routeRequest({
      requestedAction: "health check",
      requestSummary: "Routine diagnostics health check for operational sync",
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const req = report.requests[0]!;
    assert.equal(req.approvalLevel, "autonomous");
    assert.equal(req.approvalRequired, false);
    assert.equal(req.executionAllowed, true);
    assert.equal(req.currentStatus, "approved");
    assert.equal(req.requestApprovedByRouter, false);
  });

  test("4 routes a Pillow approval action into the pending queue", async () => {
    const engine = await build();
    const report = engine.routeRequest({
      requestedAction: "deploy release",
      requestSummary: "Deploy staged release to production environment",
      relatedBusiness: "bsm-biz-1",
      relatedMission: "Q0-06",
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const req = report.requests[0]!;
    assert.equal(req.approvalLevel, "pillow_approval");
    assert.equal(req.currentStatus, "pending");
    assert.equal(req.executionAllowed, false);
    const pending = engine.listPendingQueue().requests;
    assert.ok(pending.some((r) => r.approvalId === req.approvalId));
  });

  test("5 routes a Grand King approval action and blocks execution", async () => {
    const engine = await build();
    const req = engine.generateApprovalRequest({
      requestedAction: "capital allocation",
      requestSummary: "Allocate capital for strategic acquisition initiative",
      riskHints: ["high capital exposure"],
      validated: true,
    }).requests[0]!;
    assert.equal(req.approvalLevel, "grand_king_approval");
    assert.equal(req.currentStatus, "pending");
    assert.ok(req.reasonApprovalIsRequired.toLowerCase().includes("grand king"));
    const gate = engine.checkExecutionGate({ approvalId: req.approvalId, validated: true });
    assert.equal(gate.gate!.executionAllowed, false);
    assert.equal(gate.gate!.blocked, true);
  });

  test("6 generates machine-readable approval requests with history", async () => {
    const req = (await build()).generateApprovalRequest({
      requestId: "req-100",
      requestedAction: "launch market expansion",
      requestSummary: "Launch expansion into adjacent market segment",
      relatedMission: "Q0-02",
      impactHints: ["revenue upside"],
      validated: true,
    }).requests[0]!;
    assert.ok(req.approvalId.startsWith("ar-apr-"));
    assert.equal(req.requestId, "req-100");
    assert.equal(req.metadataVersion, "AR-001-v1");
    assert.ok(req.approvalHistory.length >= 1);
    assert.ok(req.riskAssessment.length > 0);
    assert.ok(req.expectedImpact.length > 0);
    assert.equal(req.neverApproveRequests, true);
  });

  test("7 tracks status via external outcome without router approval", async () => {
    const engine = await build();
    const pending = engine.routeRequest({
      requestedAction: "expand operations",
      requestSummary: "Expand regional operations under governance",
      validated: true,
    }).requests[0]!;
    const updated = engine.recordExternalOutcome({
      approvalId: pending.approvalId,
      status: "approved",
      authority: "pillow",
      note: "Pillow authority granted externally",
      validated: true,
    }).requests[0]!;
    assert.equal(updated.currentStatus, "approved");
    assert.equal(updated.executionAllowed, true);
    assert.equal(updated.requestApprovedByRouter, false);
    assert.ok(updated.approvalHistory.some((h) => h.actorRole === "external_authority"));
    const gate = engine.checkExecutionGate({ approvalId: pending.approvalId, validated: true });
    assert.equal(gate.gate!.executionAllowed, true);
  });

  test("8 rejects approve / execute / assign / override boundary violations", async () => {
    const engine = await build();
    const base = {
      requestedAction: "deploy release",
      requestSummary: "Deploy staged release to production environment",
      validated: true,
    };
    assert.equal(engine.routeRequest({ ...base, approveRequest: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, executeRequest: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 rejects empty or unvalidated requests", async () => {
    const engine = await build();
    assert.equal(
      engine.routeRequest({ requestedAction: "", requestSummary: "Valid summary text", validated: true })
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.routeRequest({
        requestedAction: "deploy release",
        requestSummary: "Deploy staged release to production environment",
        validated: false,
      }).validation.decision,
      "fail",
    );
  });

  test("10 supports multi-stage classification and capability surface", async () => {
    const engine = await build();
    const req = engine.evaluateRequest({
      requestedAction: "portfolio restructure",
      requestSummary: "Execute multi-stage portfolio restructure across businesses",
      validated: true,
    }).requests[0]!;
    assert.equal(req.approvalLevel, "multi_stage_approval");
    assert.equal(req.executionAllowed, false);
    assert.ok(AR_CAPABILITIES.includes("prevent_unauthorized_execution"));
    const validation = engine.validateApprovals().validation.decision;
    assert.ok(validation === "pass" || validation === "partial");
  });
});
