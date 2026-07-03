import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  createEmpireCommanderEngine,
  synthesizeCrossDomain,
  evaluateExecutiveDecision,
  coordinateEngines,
} from "../../empire-commander/index.js";
import {
  startPillow,
  requirePillowEmpireCommander,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 8 Empire Commander (PILLOW-EC-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Empire Commander initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const commander = requirePillowEmpireCommander();
    const state = commander.getState();
    assert.equal(state.commanderVersion, "PILLOW-EC-001");
    assert.equal(state.status, "ready");
    assert.equal(state.domainsMonitored.length, 8);
    assert.ok(state.enginesCoordinated >= 10);
  });

  test("Cross-domain reasoning synthesises all eight domains", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const crossDomain = synthesizeCrossDomain({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      technicalChief: session.technicalChief,
      uxDesigner: session.uxDesigner,
      cursorBridge: session.cursorBridge,
      infrastructureCommander: session.infrastructureCommander,
      commerceIntelligence: session.commerceIntelligence,
      planner: session.planner,
      dueDiligence: session.dueDiligence,
      improvement: session.improvement,
      orchestrator: session.orchestrator,
      objective: session.objective,
    });

    assert.equal(crossDomain.domainSignals.length, 8);
    assert.ok(crossDomain.overallHealthScore >= 0 && crossDomain.overallHealthScore <= 100);
    assert.ok(crossDomain.connectedInsights.length >= 1);
  });

  test("Executive decision engine presents ranked options", () => {
    const decision = evaluateExecutiveDecision("Should we launch a commerce store?");
    assert.ok(decision.options.length >= 2);
    assert.ok(decision.bestOptionId);
    assert.ok(decision.options[0]!.compositeScore >= decision.options[decision.options.length - 1]!.compositeScore);
    assert.match(decision.executiveSummary, /Recommended/i);
  });

  test("Engine coordination detects priorities and deduplication", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const plan = coordinateEngines({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      technicalChief: session.technicalChief,
      uxDesigner: session.uxDesigner,
      cursorBridge: session.cursorBridge,
      infrastructureCommander: session.infrastructureCommander,
      commerceIntelligence: session.commerceIntelligence,
      orchestrator: session.orchestrator,
      objective: session.objective,
    });

    assert.ok(plan.priorities.length >= 5);
    assert.ok(plan.deduplicationNotes.length >= 1);
    assert.ok(plan.scheduledActions.length >= 1);
  });

  test("Full command cycle produces executive report", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const commander = requirePillowEmpireCommander();
    const report = await commander.commandEmpire("What should we prioritise?");

    assert.equal(report.version, "PILLOW-EC-001");
    assert.equal(report.crossDomain.domainSignals.length, 8);
    assert.ok(report.strategicPlan.roadmapItems.length >= 3);
    assert.ok(report.optimization.recommendations.length >= 0);
    assert.ok(report.recommendedActions.length >= 2);
    assert.match(report.executiveBrief, /Empire Commander/i);
    assert.ok(commander.getCoordinatedDomains().length >= 8);
  });

  test("Context builder attaches empireCommanderBrief", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });

    const task = detectContextTask("What is the overall empire health?");
    assert.equal(task, "empire_commander");

    const context = await runContextBuild(
      session.bootstrap,
      session.intelligence,
      { userMessage: "What is the overall empire health?" },
      {},
      session.technicalChief,
      session.uxDesigner,
      session.cursorBridge,
      session.infrastructureCommander,
      session.commerceIntelligence,
      session.empireCommander,
    );

    assert.ok(context.empireCommanderBrief);
    assert.match(context.empireCommanderBrief!, /PILLOW-EC-001/i);
  });
});
