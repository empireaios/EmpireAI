import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import {
  createContinuousEvolutionEngine,
  inspectDueDiligence,
  scanSelfImprovement,
  discoverOpportunities,
  detectRisks,
  getOpportunityThreshold,
} from "../../continuous-evolution/index.js";
import {
  startPillow,
  requirePillowContinuousEvolution,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function evolutionDeps(session: Awaited<ReturnType<typeof startPillow>>) {
  return {
    bootstrap: session.bootstrap,
    intelligence: session.intelligence,
    dueDiligence: session.dueDiligence,
    improvement: session.improvement,
    empireCommander: session.empireCommander,
    empireOperatingSystem: session.empireOperatingSystem,
    commerceIntelligence: session.commerceIntelligence,
    infrastructureCommander: session.infrastructureCommander,
    orchestrator: session.orchestrator,
    objective: session.objective,
  };
}

describe("Phase 10 Continuous Empire Evolution (PILLOW-CEV-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Continuous Evolution initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const evolution = requirePillowContinuousEvolution();
    const state = evolution.getState();
    assert.equal(state.evolutionVersion, "PILLOW-CEV-001");
    assert.equal(state.status, "ready");
    assert.equal(state.domainsMonitored.length, 8);
    assert.ok(state.improvementBacklogSize >= 3);
  });

  test("Due diligence inspects all eight domains", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const coverage = inspectDueDiligence(evolutionDeps(session));
    assert.equal(coverage.domainsInspected.length, 8);
    assert.ok(coverage.overallWeaknessScore >= 0);
  });

  test("Self-improvement maintains prioritized backlog", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const report = scanSelfImprovement(evolutionDeps(session));
    assert.ok(report.totalItems >= 5);
    assert.ok(report.topPriority);
    assert.ok(report.backlog[0]!.priority >= report.backlog[report.backlog.length - 1]!.priority);
  });

  test("Opportunity discovery filters above threshold", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const opps = discoverOpportunities(evolutionDeps(session));
    assert.equal(getOpportunityThreshold(), 72);
    assert.ok(opps.highValueCount >= 3);
    assert.ok(opps.opportunities.every((o) => o.aboveThreshold));
  });

  test("Risk detection identifies preventive actions", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const risks = detectRisks(evolutionDeps(session));
    assert.ok(risks.risks.length >= 1);
    assert.ok(risks.risks.every((r) => r.preventiveAction.length > 0));
  });

  test("Full evolution cycle produces V1 certification", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const evolution = requirePillowContinuousEvolution();
    const report = await evolution.evolveEmpire();

    assert.equal(report.version, "PILLOW-CEV-001");
    assert.equal(report.dueDiligence.domainsInspected.length, 8);
    assert.ok(report.recommendations.length >= 3);
    assert.ok(report.optimisation.plans.length >= 3);
    assert.equal(report.version1Certification.phasesComplete, 10);
    assert.ok(["production", "conditional", "not_ready"].includes(report.version1Certification.readinessLevel));
    assert.match(report.executiveBrief, /Continuous Empire Evolution/i);
    assert.ok(evolution.getEvolutionCapabilities().length >= 7);
  });

  test("Context builder attaches continuousEvolutionBrief", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });

    const task = detectContextTask("Continuously improve the Empire");
    assert.equal(task, "continuous_evolution");

    const context = await runContextBuild(
      session.bootstrap,
      session.intelligence,
      { userMessage: "Continuously improve the Empire" },
      {},
      session.technicalChief,
      session.uxDesigner,
      session.cursorBridge,
      session.infrastructureCommander,
      session.commerceIntelligence,
      session.empireCommander,
      session.empireOperatingSystem,
      session.continuousEvolution,
    );

    assert.ok(context.continuousEvolutionBrief);
    assert.match(context.continuousEvolutionBrief!, /PILLOW-CEV-001/i);
  });
});
