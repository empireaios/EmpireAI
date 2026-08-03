import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PRR_CAPABILITIES,
  REVIEW_CRITERIA,
  REVIEW_OUTCOMES,
  buildPeerReviewRuntimeConfiguration,
  createPeerReviewRuntime,
  resetPeerReviewRuntimeForTesting,
} from "../../peer-review-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createPeerReviewRuntime>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createPeerReviewRuntime(bootstrap, config);
  await engine.initialize();
  engine.connectPeerReviewRuntime();
  return engine;
}

function sampleReviewers() {
  return [
    {
      workerId: "wcr-wkr-review-01",
      qualificationScore: 91,
      available: true,
      specialties: ["quality", "compliance"],
    },
    {
      workerId: "wcr-wkr-review-02",
      qualificationScore: 84,
      available: true,
      specialties: ["risk", "executive_readiness"],
    },
    {
      workerId: "wcr-wkr-ops-02",
      qualificationScore: 70,
      available: true,
      specialties: ["completeness"],
    },
  ];
}

describe("Q0-21 Peer Review Runtime", () => {
  beforeEach(resetPeerReviewRuntimeForTesting);

  test("1 locks mandatory peer-review-runtime boundaries", () => {
    const c = buildPeerReviewRuntimeConfiguration(REPO_ROOT, {
      neverReplaceWorkers: false as never,
      neverRewriteCompletedWork: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverExecuteBusinessTasks: false as never,
    });
    assert.equal(c.neverReplaceWorkers, true);
    assert.equal(c.neverRewriteCompletedWork, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverExecuteBusinessTasks, true);
  });

  test("2 initializes PILLOW-PRR-001 for Q0-21", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-21");
    assert.equal(state.engineVersion, "PILLOW-PRR-001");
    for (const outcome of REVIEW_OUTCOMES) {
      assert.ok(state.configuration.reviewOutcomes.includes(outcome));
    }
    for (const criterion of REVIEW_CRITERIA) {
      assert.ok(state.configuration.reviewCriteria.includes(criterion));
    }
  });

  test("3 submits completed work and selects reviewers", async () => {
    const report = (await build()).submitWork({
      missionId: "Q0-21",
      taskId: "task-high-impact-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "high",
      workSummary: "Marketplace expansion recommendation package",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    });
    assert.equal(report.peerReviewRequired, true);
    assert.ok(report.selectedReviewers.includes("wcr-wkr-review-01"));
    assert.ok(!report.selectedReviewers.includes("wcr-wkr-strategy-01"));
    assert.ok(report.records[0]!.reviewId.startsWith("prr-rev-"));
  });

  test("4 collects independent reviews and compares agreement", async () => {
    const report = (await build()).compareReviews({
      missionId: "Q0-21",
      taskId: "task-compare-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "high",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    });
    assert.ok(report.records[0]!.independentReviews.length >= 1);
    assert.ok(typeof report.agreementLevel === "number");
    assert.ok((report.agreementLevel ?? 0) > 0);
  });

  test("5 detects disagreements between reviewers", async () => {
    const report = (await build()).compareReviews({
      missionId: "Q0-21",
      taskId: "task-disagree-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "critical",
      reviewerCandidates: sampleReviewers(),
      independentReviews: [
        {
          reviewerId: "wcr-wkr-review-01",
          recommendedOutcome: "approved",
          agreementScore: 92,
          findings: ["Looks ready"],
          issues: [],
          criteriaScores: { correctness: 90, quality: 91 },
        },
        {
          reviewerId: "wcr-wkr-review-02",
          recommendedOutcome: "revision_required",
          agreementScore: 58,
          findings: ["Evidence incomplete"],
          issues: ["missing_evidence"],
          criteriaScores: { correctness: 60, quality: 55 },
        },
      ],
      validated: true,
    });
    assert.ok(report.disagreements.length >= 1);
    assert.ok(report.disagreements.some((d) => d.startsWith("outcome_disagreement:")));
  });

  test("6 generates revision requests when necessary", async () => {
    const report = (await build()).requestRevision({
      missionId: "Q0-21",
      taskId: "task-revise-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "high",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    });
    assert.equal(report.records[0]!.reviewOutcome, "revision_required");
    assert.ok(report.records[0]!.requiredRevisions.length >= 1);
  });

  test("7 escalates unresolved reviews to Pillow", async () => {
    const report = (await build()).escalateToPillow({
      missionId: "Q0-21",
      taskId: "task-escalate-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "critical",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    });
    assert.equal(report.escalationStatus, "escalated_to_pillow");
    assert.equal(report.records[0]!.reviewOutcome, "escalated");
  });

  test("8 rejects replace workers / rewrite / Pillow / Grand King / business-task boundaries", async () => {
    const engine = await build();
    const base = {
      missionId: "Q0-21",
      taskId: "task-boundary",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "high",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    };
    assert.equal(engine.review({ ...base, replaceWorkers: true }).validation.decision, "fail");
    assert.equal(
      engine.review({ ...base, rewriteCompletedWork: true }).validation.decision,
      "fail",
    );
    assert.equal(engine.review({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(
      engine.escalateToPillow({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.compareReviews({ ...base, executeBusinessTasks: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible review outcomes and criteria", async () => {
    const engine = await build({
      configuration: {
        reviewOutcomes: [...REVIEW_OUTCOMES, "conditional_approval"],
        reviewCriteria: [...REVIEW_CRITERIA, "traceability"],
      },
    });
    assert.ok(engine.getState().configuration.reviewOutcomes.includes("conditional_approval"));
    assert.ok(engine.getState().configuration.reviewCriteria.includes("traceability"));
    assert.ok(PRR_CAPABILITIES.includes("extensible_review_outcomes"));
  });

  test("10 produces machine-readable peer review records and validates them", async () => {
    const engine = await build();
    engine.review({
      missionId: "Q0-21",
      taskId: "task-validate-01",
      originalWorker: "wcr-wkr-strategy-01",
      impactLevel: "high",
      reviewerCandidates: sampleReviewers(),
      validated: true,
    });
    const validation = engine.validatePeerReviewRuntime({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.businessTasksExecuted, false);
    assert.equal(engine.getLatestRecord()?.metadataVersion, "PRR-001-v1");
  });
});
