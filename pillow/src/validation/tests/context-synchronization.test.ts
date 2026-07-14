import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { createVisionSynchronizationEngine } from "../../vision-synchronization/index.js";
import {
  createContextSynchronizationEngine,
  formatContextPreamble,
} from "../../context-synchronization/index.js";
import {
  startPillow,
  requirePillowContextSynchronization,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P4-03 Context Synchronization (PILLOW-CS-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Context Synchronization Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowContextSynchronization();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CS-001");
    assert.equal(state.status, "ready");
  });

  test("Pipeline loads vision, soul, roadmap, architecture, repository, production, journey", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const visionSync = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await visionSync.initialize();
    const engine = createContextSynchronizationEngine(
      bootstrap,
      intelligence,
      memory,
      planner,
      visionSync,
    );
    await engine.initialize();

    const pipeline = await engine.synchronize({ missionId: "P4-03" });
    assert.equal(pipeline.pipelineVersion, "P4-03");
    assert.ok(pipeline.steps.length >= 14);
    assert.ok(pipeline.contextCompletenessPercent >= 75);
    assert.ok(pipeline.contextPackage.relevantVision.length > 0);
    assert.ok(pipeline.contextPackage.relevantSoul.length > 0);
    assert.ok(pipeline.contextPackage.constitutionalArticles.length > 0);
  });

  test("Context preamble includes Context Package fields", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const visionSync = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await visionSync.initialize();
    const engine = createContextSynchronizationEngine(
      bootstrap,
      intelligence,
      memory,
      planner,
      visionSync,
    );
    await engine.initialize();
    const pipeline = await engine.synchronize();

    const preamble = formatContextPreamble(pipeline);
    assert.match(preamble, /CONTEXT SYNCHRONIZATION/);
    assert.match(preamble, /Context Package/);
    assert.match(preamble, /Relevant Vision/);
    assert.match(preamble, /Relevant Soul/);
    assert.match(preamble, /Constitutional Articles/);
  });

  test("Builder gate evaluates context completeness", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const visionSync = createVisionSynchronizationEngine(bootstrap, memory, planner);
    await visionSync.initialize();
    const engine = createContextSynchronizationEngine(
      bootstrap,
      intelligence,
      memory,
      planner,
      visionSync,
    );
    await engine.initialize();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-03" });
    assert.ok(typeof gate.allowed === "boolean");
    assert.ok(gate.pipeline.contextCompletenessPercent >= 0);
  });

  test("Generated Cursor mission includes Context Synchronization package", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /VISION SYNCHRONIZATION/);
      assert.match(doc.formatted, /CONTEXT SYNCHRONIZATION/);
      assert.match(doc.formatted, /CURSOR PROTOCOL/);
    }
  });
});
