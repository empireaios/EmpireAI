import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { runContinuousAnalysis } from "../../due-diligence/analysis-runner.js";
import { comparePriority, sortRecommendationsByPriority } from "../../due-diligence/priority-engine.js";
import {
  startPillow,
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

describe("PILLOW-011 Continuous Due Diligence Engine", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Engine initializes with BL-C doctrine present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.dueDiligence.getState();
    assert.equal(state.engineVersion, "PILLOW-011");
    assert.equal(
      state.doctrinePath,
      "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md",
    );
  });

  test("Continuous analysis produces findings and recommendations", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const report = await requirePillowDueDiligence().runAnalysisCycle();
    assert.ok(report.reportId);
    assert.ok(report.findings.length > 0);
    assert.ok(report.recommendations.length > 0);
    assert.ok(report.domainsAnalysed.length > 0);
    assert.ok(report.categoriesReviewed.length > 0);
    assert.equal(report.interrupted, false);
  });

  test("Recommendations include required fields and Grand King approval", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const recs = (await requirePillowDueDiligence().runAnalysisCycle()).recommendations;
    assert.ok(recs.length > 0);
    for (const rec of recs) {
      assert.ok(rec.reason);
      assert.ok(rec.evidence.length > 0);
      assert.ok(rec.affectedOwners.length > 0);
      assert.ok(rec.expectedBenefit);
      assert.ok(rec.recommendedAction);
      assert.equal(rec.requiresGrandKingApproval, true);
    }
  });

  test("Priority engine orders critical before future", () => {
    assert.ok(comparePriority("critical", "high") < 0);
    assert.ok(comparePriority("high", "normal") < 0);
    assert.ok(comparePriority("normal", "future") < 0);
    const sorted = sortRecommendationsByPriority([
      { priority: "future" as const },
      { priority: "critical" as const },
      { priority: "normal" as const },
    ]);
    assert.equal(sorted[0]!.priority, "critical");
  });

  test("Analysis runner uses memory and intelligence evidence", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    session.memory.ensureFresh();
    const result = runContinuousAnalysis({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      memory: session.memory.getMemory(),
      planner: session.planner,
      supervisor: session.supervisor,
    });
    assert.ok(result.findings.every((f) => f.evidence.length > 0));
  });

  test("Grand King interrupt stops idle tick immediately", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDueDiligence();
    engine.interrupt("priority command");
    const tick = await engine.tick();
    assert.equal(tick, null);
    assert.equal(engine.getState().interrupted, true);
    engine.resumeAfterInterrupt();
    const report = await engine.tick();
    assert.ok(report);
  });

  test("Journey unchanged after analysis cycle", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowDueDiligence().runAnalysisCycle();
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Analysis history queryable", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDueDiligence();
    const before = engine.getHistory().length;
    await engine.runAnalysisCycle();
    assert.equal(engine.getHistory().length, before + 1);
  });

  test("startPillow exposes ContinuousDueDiligenceEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.dueDiligence);
    assert.equal(requirePillowDueDiligence(), session.dueDiligence);
  });
});
