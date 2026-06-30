import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { detectChanges } from "../../synchronizer/change-detector.js";
import {
  canExecuteSync,
  createApproval,
  validateApproval,
} from "../../synchronizer/approval-gate.js";
import { generateSyncPreview } from "../../synchronizer/preview.js";
import { SYNC_ARTIFACT_CATALOG } from "../../synchronizer/scope.js";
import { RepositorySynchronizerEngine } from "../../synchronizer/engine.js";
import {
  startPillow,
  requirePillowSynchronizer,
  resetPillowSession,
} from "../../session.js";
import { inspectRepositoryState } from "../../recovery/inspector.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-010 Repository Synchronizer", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Synchronizer initializes with doctrines present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.synchronizer.getState();
    assert.equal(state.synchronizerVersion, "PILLOW-010");
    assert.ok(state.doctrinePaths.length >= 3);
  });

  test("Sync scope catalog covers governance artifacts", () => {
    const paths = SYNC_ARTIFACT_CATALOG.map((t) => t.relativePath);
    assert.ok(paths.includes("JOURNEY.md"));
    assert.ok(paths.includes("JOURNEY_AUDIT.md"));
    assert.ok(paths.includes("EMPIREAI_STATUS.md"));
    assert.ok(paths.includes("EMPIREAI_DECISIONS.md"));
  });

  test("Change detection from completed Pillow mission", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    session.memory.ensureFresh();
    const inspection = await inspectRepositoryState(REPO_ROOT);
    const changes = detectChanges(
      session.bootstrap,
      session.memory.getMemory(),
      inspection,
      { missionId: "PILLOW-010", missionTitle: "Repository Synchronizer", auditApproved: true },
    );
    assert.ok(changes.length >= 1);
    assert.ok(changes.some((c) => c.kind === "completed_pillow_mission"));
  });

  test("Preview Mode generates proposals without writes", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY_AUDIT.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    const preview = await requirePillowSynchronizer().previewSync({
      missionId: "PILLOW-010",
      missionTitle: "Repository Synchronizer",
    });

    assert.ok(preview.preview.previewId);
    assert.ok(preview.preview.proposals.length >= 1);
    assert.equal(preview.preview.approvalRequired, true);

    const after = await reader.readText("JOURNEY_AUDIT.md");
    assert.equal(before, after);
  });

  test("Approval gate rejects without approved outcome", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSynchronizer();
    const { preview } = await engine.previewSync({
      missionId: "PILLOW-010",
    });

    const rejected = createApproval(preview.previewId, "rejected");
    assert.equal(canExecuteSync(rejected), false);

    const result = await engine.executeWithApproval(preview, rejected);
    assert.equal(result.synchronized, false);
    assert.equal(result.record.executed, false);
  });

  test("Deferred approval does not execute writes", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    const result = await requirePillowSynchronizer().synchronize(
      { missionId: "PILLOW-010-test", trigger: "governance_change" },
      "deferred",
    );

    assert.equal(result.record.approval.outcome, "deferred");
    assert.equal(result.record.executed, false);

    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Approved sync dry-run records history without writes", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY_AUDIT.md");

    await startPillow({ repositoryRoot: REPO_ROOT, dryRunSyncExecution: true });
    const engine = requirePillowSynchronizer();
    const { preview } = await engine.previewSync({
      missionId: "PILLOW-010",
      auditApproved: true,
    });

    const approval = createApproval(preview.previewId, "approved");
    assert.ok(validateApproval(preview, approval).valid);

    const result = await engine.executeWithApproval(preview, approval);
    assert.equal(result.record.dryRun, true);
    assert.ok(result.record.proposalsApplied >= 1);
    assert.ok(result.verification);

    const after = await reader.readText("JOURNEY_AUDIT.md");
    assert.equal(before, after);
  });

  test("Synchronization history queryable", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSynchronizer();
    const before = engine.getHistory().length;
    await engine.synchronize({ missionId: "HIST-SYNC-001" }, "rejected");
    const history = engine.getHistory();
    assert.equal(history.length, before + 1);
  });

  test("startPillow exposes RepositorySynchronizerEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.synchronizer);
    assert.equal(requirePillowSynchronizer(), session.synchronizer);
  });
});
