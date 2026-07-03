import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { createCursorSupervisorEngine } from "../../supervisor/engine.js";
import { createTechnicalChiefEngine } from "../../technical-chief/index.js";
import { createUxDesignerEngine } from "../../ux-designer/index.js";
import {
  createCursorBridgeEngine,
  routeBridgeInstruction,
  interpretLog,
  runValidationPipeline,
} from "../../cursor-bridge/index.js";
import {
  startPillow,
  requirePillowCursorBridge,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 5 Autonomous Cursor Bridge (PILLOW-CB-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Cursor Bridge initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const bridge = requirePillowCursorBridge();
    const state = bridge.getState();
    assert.equal(state.bridgeVersion, "PILLOW-CB-001");
    assert.equal(state.status, "ready");
  });

  test("Routes UX instruction to ux_change kind", () => {
    const routed = routeBridgeInstruction("Change homepage background pink");
    assert.equal(routed.kind, "ux_change");
  });

  test("Routes deployment instruction", () => {
    const routed = routeBridgeInstruction("Deploy latest version to production");
    assert.equal(routed.kind, "deployment");
  });

  test("Assembles mission with tasks and dispatches to supervisor", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const supervisor = createCursorSupervisorEngine(bootstrap, memory, planner);
    await supervisor.initialize();
    const tc = createTechnicalChiefEngine(bootstrap, intelligence);
    await tc.initialize();
    const ux = createUxDesignerEngine(bootstrap);
    await ux.initialize();
    const bridge = createCursorBridgeEngine(bootstrap, planner, supervisor, tc, ux);
    await bridge.initialize();

    const result = bridge.processInstruction("Make the homepage pink");
    assert.equal(result.instruction.kind, "ux_change");
    assert.ok(result.mission.tasks.length >= 1);
    assert.ok(result.mission.requiredFiles.some((f) => f.includes("ExecutiveHomePage")));
    assert.equal(result.dispatch.dispatched, true);
    assert.ok(result.dispatch.supervisorMissionId);
    assert.ok(result.mission.artifactPath);
  });

  test("Interprets build, Railway, Vercel, GitHub, and browser logs", () => {
    const build = interpretLog("build", "Successfully compiled\nFound 0 errors");
    assert.equal(build.success, true);

    const railway = interpretLog("railway", "Deployment successful\nhealth check passed");
    assert.equal(railway.success, true);

    const vercel = interpretLog("vercel", "Build Failed\nError: module not found");
    assert.equal(vercel.success, false);

    const github = interpretLog("github", "Process completed with exit code 0");
    assert.equal(github.success, true);

    const browser = interpretLog("browser", "Failed to fetch at /api/pillow/session");
    assert.equal(browser.success, false);
  });

  test("Validation pipeline certifies clean engineering work", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const supervisor = createCursorSupervisorEngine(bootstrap, memory, planner);
    await supervisor.initialize();
    const tc = createTechnicalChiefEngine(bootstrap, intelligence);
    await tc.initialize();
    const ux = createUxDesignerEngine(bootstrap);
    await ux.initialize();
    const bridge = createCursorBridgeEngine(bootstrap, planner, supervisor, tc, ux);
    await bridge.initialize();

    const mission = bridge.processInstruction("Make homepage pink", { autoDispatch: false });
    const { validation } = runValidationPipeline({
      mission: mission.mission,
      changedFiles: ["empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx"],
      logs: [
        { source: "build", text: "Successfully compiled\nFound 0 errors" },
        { source: "test", text: "8 pass\n0 fail" },
        { source: "browser", text: "health 200\nsession ok" },
      ],
      technicalChief: tc,
      uxDesigner: ux,
    });

    assert.equal(validation.passed, true);
    assert.equal(validation.buildOk, true);
    assert.equal(validation.cursorReviewOk, true);
  });

  test("Context builder attaches cursorBridgeBrief", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const supervisor = createCursorSupervisorEngine(bootstrap, memory, planner);
    await supervisor.initialize();
    const tc = createTechnicalChiefEngine(bootstrap, intelligence);
    await tc.initialize();
    const ux = createUxDesignerEngine(bootstrap);
    await ux.initialize();
    const bridge = createCursorBridgeEngine(bootstrap, planner, supervisor, tc, ux);
    await bridge.initialize();

    const task = detectContextTask("Deploy latest version");
    assert.equal(task, "cursor_bridge");

    const context = await runContextBuild(
      bootstrap,
      intelligence,
      { userMessage: "Deploy latest version" },
      {},
      tc,
      ux,
      bridge,
    );

    assert.ok(context.cursorBridgeBrief);
    assert.match(context.cursorBridgeBrief!, /PILLOW-CB-001/i);
    assert.match(context.cursorBridgeBrief!, /Deploy/i);
  });
});
