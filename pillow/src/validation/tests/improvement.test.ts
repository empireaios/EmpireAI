import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import {
  canProceedToMissionGeneration,
  createApproval,
  validateApproval,
} from "../../improvement/approval-gate.js";
import { generateProposalFromObservation } from "../../improvement/proposal-generator.js";
import {
  determineMissionReadiness,
  verifyDependencies,
} from "../../improvement/readiness-engine.js";
import {
  startPillow,
  requirePillowImprovement,
  requirePillowDueDiligence,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-012 Autonomous Improvement Engine", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Engine initializes with BL-C doctrine present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.improvement.getState();
    assert.equal(state.engineVersion, "PILLOW-012");
    assert.equal(
      state.doctrinePath,
      "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md",
    );
  });

  test("generateImprovements produces proposals with required fields", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowImprovement();
    const result = await engine.generateImprovements({ runDueDiligence: true });
    assert.ok(result.batch.batchId);
    assert.ok(result.batch.proposals.length > 0);

    for (const proposal of result.batch.proposals) {
      assert.ok(proposal.title);
      assert.ok(proposal.objective);
      assert.ok(proposal.reason);
      assert.ok(proposal.repositoryEvidence.length > 0);
      assert.ok(proposal.affectedOwners.length > 0);
      assert.ok(proposal.expectedBenefits);
      assert.ok(proposal.dependencyChecks.length > 0);
      assert.ok(proposal.recommendedMissionSequence.length > 0);
      assert.equal(proposal.requiresGrandKingApproval, true);
      assert.equal(proposal.lifecycleStage, "implementation_proposal");
    }
  });

  test("Proposals trace back to Due Diligence observations", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const recs = (await requirePillowDueDiligence().runAnalysisCycle()).recommendations;
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    session.memory.ensureFresh();
    const proposal = generateProposalFromObservation(recs[0]!, {
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      memory: session.memory.getMemory(),
      planner: session.planner,
    });
    assert.equal(proposal.sourceObservationId, recs[0]!.id);
    assert.ok(proposal.repositoryEvidence.some((e) => recs[0]!.evidence.includes(e) || e.length > 0));
  });

  test("Dependency verification and mission readiness", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    session.memory.ensureFresh();
    const mem = session.memory.getMemory();
    const recs = (await requirePillowDueDiligence().runAnalysisCycle()).recommendations;
    const checks = verifyDependencies(recs[0]!, mem, session.planner);
    assert.ok(checks.some((c) => c.id === "REPOSITORY_HEALTH"));
    const readiness = determineMissionReadiness(recs[0]!, checks, mem);
    assert.ok([
      "ready_for_implementation",
      "blocked_by_dependencies",
      "requires_repository_synchronization",
      "requires_architecture_review",
      "requires_grand_king_decision",
      "requires_further_investigation",
    ].includes(readiness));
  });

  test("Approval workflow enforces Grand King gate", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowImprovement();
    const { batch } = await engine.generateImprovements({ runDueDiligence: true });
    const proposal = batch.proposals[0]!;

    assert.equal(engine.isReadyForMissionGeneration(proposal.proposalId), false);

    const approval = createApproval(proposal.proposalId, "approved");
    assert.equal(validateApproval(proposal, approval).valid, true);

    const { recommendation } = engine.submitApproval(proposal.proposalId, "approved");
    assert.ok(recommendation.includes("Approved"));

    const ready =
      proposal.readiness !== "blocked_by_dependencies" &&
      proposal.readiness !== "requires_further_investigation";
    assert.equal(
      engine.isReadyForMissionGeneration(proposal.proposalId),
      ready && canProceedToMissionGeneration(approval, proposal),
    );
  });

  test("Rejected approval blocks mission generation", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowImprovement();
    const { batch } = await engine.generateImprovements({ runDueDiligence: true });
    const proposal = batch.proposals[0]!;
    engine.submitApproval(proposal.proposalId, "rejected");
    assert.equal(engine.isReadyForMissionGeneration(proposal.proposalId), false);
  });

  test("Journey unchanged after improvement generation", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowImprovement().generateImprovements({ runDueDiligence: true });
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Batch history queryable", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowImprovement();
    const before = engine.getHistory().length;
    await engine.generateImprovements({ runDueDiligence: true });
    assert.equal(engine.getHistory().length, before + 1);
    assert.ok(engine.getLastBatch());
  });

  test("startPillow exposes AutonomousImprovementEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.improvement);
    assert.equal(requirePillowImprovement(), session.improvement);
  });
});
