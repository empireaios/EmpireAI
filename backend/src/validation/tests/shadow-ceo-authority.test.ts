import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  LIVE_SIDE_EFFECT_KINDS,
  MISSION_DEFAULT_MODE,
  assertModeTransition,
  attemptExternalAction,
  attemptExternalActionAndPersist,
  createApprovalRequest,
  createBlockedActionRecord,
  defaultBudgetEnvelope,
  isApprovalGranted,
  listBlockedActions,
  stopOperatingLoop,
  stopOperatingLoopAndPersist,
  wouldExceedBudget,
} from "../../orchestration/shadow-ceo-authority/index.js";

const tempDirs: string[] = [];

function tempStoreDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sca-auth-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("shadow-ceo-authority — operating modes & fail-closed gate", () => {
  it("mission default mode is SYNTHETIC", () => {
    assert.equal(MISSION_DEFAULT_MODE, "SYNTHETIC");
  });

  it("every live-looking attempt fails closed and yields BLOCKED", () => {
    for (const kind of LIVE_SIDE_EFFECT_KINDS) {
      const result = attemptExternalAction({
        kind,
        mode: "SYNTHETIC",
        approvalStatus: "none",
        authorized: true,
      });
      assert.equal(result.decision, "BLOCKED");
      assert.equal(result.reason, "LIVE_SIDE_EFFECT_FORBIDDEN");
    }
  });

  it("LIVE_EXECUTION mode is mission-restricted even for synthetic kinds", () => {
    const result = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "LIVE_EXECUTION",
      approvalStatus: "granted",
      approvalSource: "deterministic_store",
      authorized: true,
    });
    assert.equal(result.decision, "BLOCKED");
    assert.equal(result.reason, "MISSION_MODE_RESTRICTED");
  });

  it("pending approval is never treated as granted", () => {
    assert.equal(isApprovalGranted("pending"), false);
    assert.equal(isApprovalGranted("granted"), true);

    const pending = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "APPROVAL_REQUIRED",
      approvalStatus: "pending",
      approvalSource: "deterministic_store",
      authorized: true,
    });
    assert.equal(pending.decision, "BLOCKED");
    assert.equal(pending.reason, "APPROVAL_PENDING_NOT_GRANTED");

    const pendingSynthetic = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "pending",
      authorized: true,
    });
    assert.equal(pendingSynthetic.decision, "BLOCKED");
    assert.equal(pendingSynthetic.reason, "APPROVAL_PENDING_NOT_GRANTED");
  });

  it("rejects LLM-claimed approval source", () => {
    const result = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "granted",
      approvalSource: "llm_claim",
      authorized: true,
    });
    assert.equal(result.decision, "BLOCKED");
    assert.equal(result.reason, "LLM_APPROVAL_FORBIDDEN");
  });

  it("SYNTHETIC synthetic_experiment_run proceeds when authorized", () => {
    const result = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "none",
      approvalSource: "deterministic_store",
      authorized: true,
    });
    assert.equal(result.decision, "ALLOWED");
    assert.equal(result.reason, "SYNTHETIC_AUTHORIZED");
  });

  it("unauthorized synthetic_experiment_run is blocked", () => {
    const result = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "none",
      authorized: false,
    });
    assert.equal(result.decision, "BLOCKED");
    assert.equal(result.reason, "UNAUTHORIZED");
  });

  it("assertModeTransition forbids silent synthetic→live", () => {
    const silent = assertModeTransition({
      from: "SYNTHETIC",
      to: "LIVE_EXECUTION",
      explicitlyAuthorized: false,
    });
    assert.equal(silent.allowed, false);
    assert.equal(silent.reason, "SILENT_SYNTHETIC_TO_LIVE_FORBIDDEN");

    const silentRo = assertModeTransition({
      from: "SYNTHETIC",
      to: "READ_ONLY_LIVE",
    });
    assert.equal(silentRo.allowed, false);

    const explicit = assertModeTransition({
      from: "SYNTHETIC",
      to: "READ_ONLY_LIVE",
      explicitlyAuthorized: true,
    });
    assert.equal(explicit.allowed, true);
  });

  it("budget envelope uses deterministic caps 10000 / 500", () => {
    const budget = defaultBudgetEnvelope();
    assert.equal(budget.totalCapSgd, 10_000);
    assert.equal(budget.monthlyOopCapSgd, 500);
    assert.equal(budget.source, "deterministic_state");
    assert.equal(wouldExceedBudget(budget, 501), true);
    assert.equal(wouldExceedBudget(budget, 500), false);

    const over = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "none",
      authorized: true,
      proposedSpendSgd: 600,
      budget,
    });
    assert.equal(over.decision, "BLOCKED");
    assert.equal(over.reason, "BUDGET_ENVELOPE_EXCEEDED");
  });

  it("createBlockedActionRecord and createApprovalRequest are pure factories", () => {
    const blocked = createBlockedActionRecord({
      kind: "listing",
      mode: "SYNTHETIC",
      approvalStatus: "none",
      reason: "LIVE_SIDE_EFFECT_FORBIDDEN",
    });
    assert.equal(blocked.decision, "BLOCKED");
    assert.ok(blocked.recordId.startsWith("blk_"));

    const approval = createApprovalRequest({
      kind: "ads",
      mode: "APPROVAL_REQUIRED",
      reason: "external_spend",
      requestedAction: "run ads",
      whyRequired: "paid media requires Grand King",
      financialExternalConsequence: "real advertising spend",
    });
    assert.equal(approval.status, "pending");
    assert.equal(approval.source, "deterministic_store");
    assert.equal(approval.approvingAuthority, "grand_king");
  });

  it("persists blocked actions in JSON store under repository data path", () => {
    const dir = tempStoreDir();
    const result = attemptExternalActionAndPersist(
      {
        kind: "money_move",
        mode: "SYNTHETIC",
        approvalStatus: "none",
      },
      dir,
    );
    assert.equal(result.decision, "BLOCKED");
    const listed = listBlockedActions(dir);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.kind, "money_move");
    assert.ok(fs.existsSync(path.join(dir, "authority-store.json")));
  });

  it("stopOperatingLoop halts for Grand King", () => {
    const stopped = stopOperatingLoop("founder_halt");
    assert.equal(stopped.running, false);
    assert.equal(stopped.stopReason, "founder_halt");
    assert.equal(stopped.stopRecord?.stoppedBy, "grand_king");

    const dir = tempStoreDir();
    const persisted = stopOperatingLoopAndPersist("inspect_and_stop", undefined, dir);
    assert.equal(persisted.running, false);

    const afterStop = attemptExternalAction({
      kind: "synthetic_experiment_run",
      mode: "SYNTHETIC",
      approvalStatus: "none",
      authorized: true,
      loopRunning: false,
    });
    assert.equal(afterStop.decision, "BLOCKED");
    assert.equal(afterStop.reason, "LOOP_STOPPED");
  });

  it("credential_read always blocked", () => {
    const result = attemptExternalAction({
      kind: "credential_read",
      mode: "SYNTHETIC",
      approvalStatus: "granted",
      approvalSource: "deterministic_store",
      authorized: true,
    });
    assert.equal(result.decision, "BLOCKED");
    assert.equal(result.reason, "CREDENTIAL_EXPOSURE_FORBIDDEN");
  });
});
