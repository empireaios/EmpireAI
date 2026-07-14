import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import {
  createVisionSynchronizationEngine,
  evaluateBuilderSyncGate,
  formatMissionPreamble,
} from "../../vision-synchronization/index.js";
import {
  startPillow,
  requirePillowVisionSynchronization,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P4-02 Vision Synchronization (PILLOW-VS-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Vision Synchronization Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionSynchronization();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-VS-001");
    assert.equal(state.status, "ready");
  });

  test("Pipeline executes all mandatory steps", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail("bootstrap failed");
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const engine = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await engine.initialize();

    const pipeline = await engine.synchronize({ missionId: "P4-02" });
    assert.equal(pipeline.pipelineVersion, "P4-02");
    assert.equal(pipeline.steps.length, 14);
    assert.ok(pipeline.missionContext.why.length > 0);
    assert.ok(pipeline.missionContext.what.length > 0);
    assert.ok(pipeline.missionContext.how.length > 0);
    assert.ok(pipeline.missionContext.proof.length > 0);
  });

  test("Mission preamble includes WHY WHAT HOW PROOF chain", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const engine = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await engine.initialize();
    const pipeline = await engine.synchronize();

    const preamble = formatMissionPreamble(pipeline);
    assert.match(preamble, /VISION SYNCHRONIZATION/);
    assert.match(preamble, /## WHY/);
    assert.match(preamble, /## WHAT/);
    assert.match(preamble, /## HOW/);
    assert.match(preamble, /## PROOF/);
    assert.match(preamble, /Mission Generation/);
  });

  test("Builder gate evaluates allowed state", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const engine = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await engine.initialize();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-02" });
    assert.ok(typeof gate.allowed === "boolean");
    assert.ok(gate.pipeline.steps.length === 14);
    if (!gate.allowed) {
      assert.ok(gate.reason.includes("refused") || gate.reason.includes("override"));
    } else {
      const recheck = evaluateBuilderSyncGate(gate.pipeline);
      assert.equal(recheck.allowed, true);
    }
  });

  test("Generated Cursor mission includes synchronization preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /VISION SYNCHRONIZATION/);
      assert.match(doc.formatted, /## WHY/);
    }
  });
});
