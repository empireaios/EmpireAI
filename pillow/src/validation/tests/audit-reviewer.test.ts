import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { ExecutiveAuditReviewerEngine } from "../../audit-reviewer/engine.js";
import { verifyAcceptanceCriteria } from "../../audit-reviewer/acceptance-verifier.js";
import { verifyContractCompliance } from "../../audit-reviewer/contract-verifier.js";
import { determineReviewDecision } from "../../audit-reviewer/decision-engine.js";
import { categorizeRecommendations } from "../../audit-reviewer/recommendation-engine.js";
import { isApprovalDecision } from "../../audit-reviewer/types.js";
import { createInitialHealth } from "../../supervisor/monitor.js";
import type { SupervisedMission } from "../../supervisor/types.js";
import {
  startPillow,
  requirePillowAuditReviewer,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

function sampleMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const at = new Date().toISOString();
  return {
    id: "PILLOW-008",
    title: "Recovery Manager",
    state: "executive_audit",
    launchedAt: at,
    updatedAt: at,
    stateEnteredAt: at,
    durationMs: 0,
    heartbeats: [],
    progress: [
      { at, kind: "validation_executed", detail: "80/80 pass" },
      { at, kind: "executive_audit_generated", detail: "Audit produced" },
    ],
    health: createInitialHealth(at),
    dependencies: [
      "PILLOW-002",
      "PILLOW-003",
      "PILLOW-004",
      "PILLOW-005",
      "PILLOW-006",
      "PILLOW-007",
    ],
    outcome: "pending",
    executiveAuditProduced: true,
    validationCompleted: true,
    recoveryAttempts: 0,
    missionAuthority: "PILLOW_ARCHITECTURE_CONTRACT.md Part 4.18",
    objective: "Autonomous engineering recovery",
    ...overrides,
  };
}

function sampleAudit(missionId: string): string {
  return `# Executive Audit — ${missionId}

## Summary
Mission implementation complete per authority.

## Repository Owner(s)
Pillow Architecture

## Owner Justification
Owner: Pillow Architecture — canonical runtime location per PILLOW Architecture Contract Part 4.

## Validation
npm run pillow:typecheck pass · npm run pillow:test 80/80 pass

## Acceptance criteria
All acceptance criteria met and verified individually.

## Repository continuity
Repository unchanged except intended engineering files. Read-only governance verified.

## Journey Synchronization
JOURNEY.md updated per mission closeout.

## Executive Recommendation
Accept mission completion.

## Future Enhancements
Non-blocking improvements registered in PILLOW Enhancement Register.

Stop rule: Do not begin next mission until Executive Audit approved.`;
}

describe("PILLOW-009 Executive Audit Reviewer", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Reviewer initializes with audit standard present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.auditReviewer.getState();
    assert.equal(state.reviewerVersion, "PILLOW-009");
    assert.equal(state.auditStandardPath, "EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md");
  });

  test("Contract verification for sequence mission", () => {
    const result = verifyContractCompliance(
      sampleMission(),
      sampleAudit("PILLOW-008"),
    );
    assert.equal(result.category, "contract_compliance");
    assert.ok(["passed", "partially_passed"].includes(result.result));
  });

  test("Acceptance criteria verified individually", () => {
    const { criteria } = verifyAcceptanceCriteria(
      sampleMission(),
      sampleAudit("PILLOW-008"),
    );
    assert.ok(criteria.length >= 3);
    assert.ok(criteria.every((c) => c.result !== undefined));
  });

  test("Decision engine rejects mandatory corrections", () => {
    const recs = categorizeRecommendations("Mandatory correction required before approval");
    const { decision } = determineReviewDecision([], recs, false);
    assert.equal(decision, "rejected");
  });

  test("Decision engine approves clean review", () => {
    const categories = [
      {
        category: "contract_compliance" as const,
        result: "passed" as const,
        score: 100,
        findings: [],
      },
      {
        category: "acceptance_compliance" as const,
        result: "passed" as const,
        score: 100,
        findings: [],
      },
    ];
    const { decision } = determineReviewDecision(categories, [], false);
    assert.equal(decision, "approved");
    assert.ok(isApprovalDecision(decision));
  });

  test("Full review produces decision with reasoning", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAuditReviewer();
    const result = await engine.reviewMission({
      mission: sampleMission(),
      auditText: sampleAudit("PILLOW-008"),
      typecheckPassed: true,
      buildPassed: true,
    });
    assert.ok(result.record.recordId);
    assert.ok(result.record.reasoning);
    assert.equal(result.record.invokedBy, "cursor_supervisor");
    assert.equal(result.record.categories.length, 10);
    assert.ok(result.record.acceptanceCriteria.length >= 3);
  });

  test("Incomplete audit rejected or requires manual review", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const result = await requirePillowAuditReviewer().reviewMission({
      mission: sampleMission({ validationCompleted: false }),
      auditText: "Short audit without required sections",
    });
    assert.equal(result.approved, false);
    assert.ok(
      ["rejected", "manual_review_required", "conditionally_approved"].includes(
        result.record.decision,
      ),
    );
  });

  test("Supervisor blocks completion without reviewer approval", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = session.planner.generateNextMission();
    assert.ok(doc);
    const { mission } = session.supervisor.launchMission({ document: doc! });

    const blocked = await session.supervisor.completeMission(mission.id);
    assert.equal(blocked, null);

    session.supervisor.recordMissionProgress(mission.id, {
      kind: "validation_executed",
      detail: "pass",
    });
    session.supervisor.recordMissionProgress(mission.id, {
      kind: "executive_audit_generated",
      detail: "Audit",
    });

    const auditText = sampleAudit(mission.id);
    const completed = await session.supervisor.completeMission(mission.id, auditText);
    if (completed) {
      assert.equal(completed.state, "completed");
      const review = session.supervisor.getLastReviewRecord(mission.id);
      assert.ok(review);
    } else {
      const review = session.supervisor.getLastReviewRecord(mission.id);
      assert.ok(review);
      assert.ok(review!.decision);
    }
  });

  test("Review history stored", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAuditReviewer();
    await engine.reviewMission({
      mission: sampleMission({ id: "PILLOW-008" }),
      auditText: sampleAudit("PILLOW-008"),
      typecheckPassed: true,
      buildPassed: true,
    });
    const history = engine.getHistory("PILLOW-008");
    assert.equal(history.length, 1);
  });

  test("Journey unchanged after review", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowAuditReviewer().reviewMission({
      mission: sampleMission(),
      auditText: sampleAudit("PILLOW-008"),
      typecheckPassed: true,
      buildPassed: true,
    });
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("startPillow exposes ExecutiveAuditReviewerEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.auditReviewer);
    assert.equal(requirePillowAuditReviewer(), session.auditReviewer);
  });
});
