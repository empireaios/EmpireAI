import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

import {
  DEFAULT_SHADOW_CEO_MODE,
  assertCompletable,
  buildObjective,
  completedWithEvidence,
  loadChain,
  openShadowCeoRepository,
  runVerticalSliceDemo,
  verifyChainIntegrity,
  type SqliteShadowCeoRepository,
} from "../../orchestration/shadow-ceo/index.js";

describe("Shadow CEO control plane", () => {
  const repos: SqliteShadowCeoRepository[] = [];
  let tmpDir: string | null = null;

  afterEach(() => {
    while (repos.length) {
      const r = repos.pop();
      try {
        r?.close();
      } catch {
        // already closed
      }
    }
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  function openTempRepo(): SqliteShadowCeoRepository {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadow-ceo-"));
    const repo = openShadowCeoRepository({
      dbPath: path.join(tmpDir, "shadow-ceo.db"),
    });
    repos.push(repo);
    return repo;
  }

  it("creates a durable vertical slice with synthetic labels and chain integrity", () => {
    const repo = openTempRepo();
    const result = runVerticalSliceDemo({
      repo,
      workspaceId: "ws_shadow_test",
      runKey: "test-slice-create",
    });

    assert.equal(result.chain.objective.mode, DEFAULT_SHADOW_CEO_MODE);
    assert.equal(result.chain.objective.source, "synthetic");
    assert.notEqual(result.chain.objective.economicClaim, "live_profit");

    assert.ok(result.chain.assessment);
    assert.equal(result.chain.priorities.length, 2);
    assert.ok(result.chain.decision);
    assert.equal(result.chain.tasks.length, 2);
    assert.equal(result.created.blockedApprovalAction.executionStatus, "BLOCKED");
    assert.equal(result.created.blockedApprovalAction.actionKind, "APPROVAL_REQUIRED");
    assert.equal(result.created.authorizedSyntheticAction.source, "synthetic");
    assert.equal(
      result.created.authorizedSyntheticAction.executionStatus,
      "EXECUTED",
    );
    assert.notEqual(
      result.created.authorizedSyntheticAction.economicClaim,
      "live_profit",
    );
    assert.ok(result.chain.outcome);
    assert.ok(result.chain.lesson);
    assert.ok(result.chain.brief);

    const issues = verifyChainIntegrity(result.chain);
    assert.deepEqual(issues, []);

    // Completed stages must carry evidence.
    assert.equal(result.chain.objective.completion.status, "COMPLETED");
    assert.ok(result.chain.objective.completion.evidence?.summary);
    assert.equal(result.created.blockedApproval.approvalStatus, "BLOCKED");
  });

  it("reloads by objectiveId without duplication when replaying idempotency keys", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadow-ceo-"));
    const dbPath = path.join(tmpDir, "shadow-ceo.db");
    const runKey = "test-slice-idempotent";

    const repo1 = openShadowCeoRepository({ dbPath });
    repos.push(repo1);
    const first = runVerticalSliceDemo({
      repo: repo1,
      workspaceId: "ws_shadow_idem",
      runKey,
    });
    const countAfterFirst = repo1.countByObjective(first.objectiveId);
    assert.ok(countAfterFirst >= 12, `expected >=12 records, got ${countAfterFirst}`);

    // Simulate process restart: close (sync flush) and reopen same file.
    repo1.close();

    const repo2 = openShadowCeoRepository({ dbPath });
    repos.push(repo2);
    const reloaded = loadChain(repo2, first.objectiveId);
    assert.ok(reloaded);
    assert.equal(reloaded.objective.id, first.objectiveId);
    assert.equal(reloaded.tasks.length, 2);
    assert.equal(reloaded.actions.length, 2);
    assert.deepEqual(verifyChainIntegrity(reloaded), []);

    const second = runVerticalSliceDemo({
      repo: repo2,
      workspaceId: "ws_shadow_idem",
      runKey,
    });
    assert.equal(second.objectiveId, first.objectiveId);
    assert.equal(second.created.decision.id, first.created.decision.id);
    assert.equal(
      second.created.authorizedSyntheticAction.id,
      first.created.authorizedSyntheticAction.id,
    );

    const countAfterReplay = repo2.countByObjective(first.objectiveId);
    assert.equal(
      countAfterReplay,
      countAfterFirst,
      "idempotent replay must not duplicate durable records",
    );
  });

  it("refuses COMPLETED without evidence and rejects synthetic live_profit", () => {
    assert.throws(
      () =>
        assertCompletable({
          status: "COMPLETED",
          evidence: { summary: "", artifacts: {}, capturedAt: new Date().toISOString() },
          completedAt: new Date().toISOString(),
        }),
      /evidence/i,
    );

    assert.throws(
      () =>
        completedWithEvidence({
          summary: "   ",
          artifacts: {},
          capturedAt: new Date().toISOString(),
        }),
      /evidence\.summary/,
    );

    assert.throws(
      () =>
        buildObjective({
          workspaceId: "ws",
          title: "x",
          statement: "y",
          idempotencyKey: "bad-profit",
          source: "synthetic",
          economicClaim: "live_profit",
        }),
      /live profit/i,
    );
  });
});
