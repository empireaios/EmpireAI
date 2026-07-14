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
import { createVisionSynchronizationEngine } from "../../vision-synchronization/index.js";
import { createContextSynchronizationEngine } from "../../context-synchronization/index.js";
import { createCursorProtocolEngine } from "../../cursor-protocol/index.js";
import { createRecoveryDoctrineEngine } from "../../recovery-doctrine/index.js";
import { createBrowserTruthEngine } from "../../browser-truth/index.js";
import { createE2eTestingEngine } from "../../e2e-testing/index.js";
import { createJourneySystemEngine } from "../../journey-system/index.js";
import { createBrainRuntimeEngine } from "../../brain-runtime/index.js";
import { createProductionModeEngine } from "../../production-mode/index.js";
import { createDurableSessionEngine } from "../../durable-sessions/index.js";
import { createGuardianMonitoringEngine } from "../../guardian-monitoring/index.js";
import { createScalingArchitectureEngine } from "../../scaling-architecture/index.js";
import { createPerformanceGovernanceEngine } from "../../performance-governance/index.js";
import { createExecutionControlCenterEngine } from "../../execution-control-center/index.js";
import { createVisionIntegrityEngine } from "../../vision-integrity-engine/index.js";
import { createBuilderMonitorEngine } from "../../builder-monitor/index.js";
import { createEtaEngine } from "../../eta-engine/index.js";
import { createAutonomousRecoveryEngine } from "../../autonomous-recovery-engine/index.js";
import { createZeroHumanAutomationEngine } from "../../zero-human-automation/index.js";
import { createFounderShellEngine } from "../../founder-shell/index.js";
import { RecoveryManagerEngine } from "../../recovery/engine.js";
import {
  startPillow,
  requirePillowCursorBridge,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function createTestCursorBridge() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
  if (!isBootstrapReady(bootstrap)) assert.fail();
  const intelligence = await runRepositoryIntelligence({ bootstrap });
  const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
  memory.initialize();
  const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
  planner.initialize();
  const visionSync = createVisionSynchronizationEngine(bootstrap, memory, planner);
  await visionSync.initialize();
  const contextSync = createContextSynchronizationEngine(
    bootstrap,
    intelligence,
    memory,
    planner,
    visionSync,
  );
  await contextSync.initialize();
  const cursorProtocol = createCursorProtocolEngine(
    bootstrap,
    planner,
    visionSync,
    contextSync,
  );
  await cursorProtocol.initialize();
  const recovery = new RecoveryManagerEngine(bootstrap, { dryRunValidation: true });
  await recovery.initialize();
  const recoveryDoctrine = createRecoveryDoctrineEngine(
    bootstrap,
    recovery,
    planner,
  );
  await recoveryDoctrine.initialize();
  cursorProtocol.setRecoveryDoctrine(recoveryDoctrine);
  const browserTruth = createBrowserTruthEngine(bootstrap, { dryRunProductionProbe: true });
  await browserTruth.initialize();
  await browserTruth.refreshReadiness();
  cursorProtocol.setBrowserTruth(browserTruth);
  const e2eTesting = createE2eTestingEngine(bootstrap, { dryRunExecution: true });
  await e2eTesting.initialize();
  await e2eTesting.refreshReadiness({ missionId: "P4-07" });
  cursorProtocol.setE2eTesting(e2eTesting);
  const journeySystem = createJourneySystemEngine(bootstrap);
  await journeySystem.initialize();
  await journeySystem.refreshReadiness({ missionId: "P4-08" });
  cursorProtocol.setJourneySystem(journeySystem);
  const brainRuntime = createBrainRuntimeEngine(bootstrap);
  await brainRuntime.initialize();
  await brainRuntime.refreshReadiness({ missionId: "P5-01" });
  brainRuntime.runAssessment();
  cursorProtocol.setBrainRuntime(brainRuntime);
  const productionMode = createProductionModeEngine(bootstrap);
  await productionMode.initialize();
  await productionMode.refreshReadiness({ missionId: "P5-02" });
  productionMode.runAssessment();
  cursorProtocol.setProductionMode(productionMode);
  const durableSessions = createDurableSessionEngine(bootstrap);
  await durableSessions.initialize();
  await durableSessions.refreshReadiness({ missionId: "P5-03" });
  durableSessions.runAssessment();
  cursorProtocol.setDurableSessions(durableSessions);
  const guardianMonitoring = createGuardianMonitoringEngine(bootstrap);
  await guardianMonitoring.initialize();
  await guardianMonitoring.refreshReadiness({ missionId: "P5-04" });
  guardianMonitoring.runAssessment();
  cursorProtocol.setGuardianMonitoring(guardianMonitoring);
  const scalingArchitecture = createScalingArchitectureEngine(bootstrap);
  await scalingArchitecture.initialize();
  await scalingArchitecture.refreshReadiness({ missionId: "P5-05" });
  scalingArchitecture.runAssessment();
  cursorProtocol.setScalingArchitecture(scalingArchitecture);
  const performanceGovernance = createPerformanceGovernanceEngine(bootstrap);
  await performanceGovernance.initialize();
  await performanceGovernance.refreshReadiness({ missionId: "P5-06" });
  performanceGovernance.runAssessment();
  cursorProtocol.setPerformanceGovernance(performanceGovernance);
  const executionControlCenter = createExecutionControlCenterEngine(bootstrap);
  await executionControlCenter.initialize();
  await executionControlCenter.refreshReadiness({ missionId: "P6-01" });
  cursorProtocol.setExecutionControlCenter(executionControlCenter);
  const visionIntegrity = createVisionIntegrityEngine(bootstrap);
  await visionIntegrity.initialize();
  await visionIntegrity.refreshReadiness({ missionId: "P6-02" });
  cursorProtocol.setVisionIntegrity(visionIntegrity);
  const builderMonitor = createBuilderMonitorEngine(bootstrap);
  await builderMonitor.initialize();
  await builderMonitor.refreshReadiness({ missionId: "P6-04" });
  const etaEngine = createEtaEngine(bootstrap);
  await etaEngine.initialize();
  await etaEngine.refreshReadiness({ missionId: "P6-05", roadmapItem: "P6-05" });
  const autonomousRecoveryEngine = createAutonomousRecoveryEngine(bootstrap);
  await autonomousRecoveryEngine.initialize();
  await autonomousRecoveryEngine.refreshReadiness({ missionId: "P6-06", roadmapItem: "P6-06" });
  const zeroHumanAutomationEngine = createZeroHumanAutomationEngine(bootstrap);
  await zeroHumanAutomationEngine.initialize();
  await zeroHumanAutomationEngine.refreshReadiness({ missionId: "P6-07", roadmapItem: "P6-07" });
  const founderShellEngine = createFounderShellEngine(bootstrap);
  await founderShellEngine.initialize();
  await founderShellEngine.refreshReadiness({ missionId: "P7-01", roadmapItem: "P7-01" });
  planner.setVisionSynchronization(visionSync);
  planner.setContextSynchronization(contextSync);
  planner.setCursorProtocol(cursorProtocol);
  planner.setRecoveryDoctrine(recoveryDoctrine);
  planner.setBrowserTruth(browserTruth);
  planner.setE2eTesting(e2eTesting);
  planner.setJourneySystem(journeySystem);
  planner.setBrainRuntime(brainRuntime);
  planner.setProductionMode(productionMode);
  planner.setDurableSessions(durableSessions);
  planner.setGuardianMonitoring(guardianMonitoring);
  planner.setScalingArchitecture(scalingArchitecture);
  planner.setPerformanceGovernance(performanceGovernance);
  planner.setExecutionControlCenter(executionControlCenter);
  planner.setVisionIntegrity(visionIntegrity);
  const supervisor = createCursorSupervisorEngine(bootstrap, memory, planner, {
    visionSync,
    contextSync,
    recoveryManager: recovery,
    recoveryDoctrine,
    browserTruth,
    e2eTesting,
    journeySystem,
    brainRuntime,
    productionMode,
    durableSessions,
    guardianMonitoring,
    scalingArchitecture,
    performanceGovernance,
    executionControlCenter,
    visionIntegrity,
  });
  await supervisor.initialize();
  supervisor.setBuilderMonitor(builderMonitor);
  const tc = createTechnicalChiefEngine(bootstrap, intelligence);
  await tc.initialize();
  const ux = createUxDesignerEngine(bootstrap);
  await ux.initialize();
  const bridge = createCursorBridgeEngine(
    bootstrap,
    planner,
    supervisor,
    tc,
    ux,
    visionSync,
    contextSync,
    cursorProtocol,
    recoveryDoctrine,
    browserTruth,
    e2eTesting,
    journeySystem,
    brainRuntime,
    productionMode,
    durableSessions,
    guardianMonitoring,
    scalingArchitecture,
    performanceGovernance,
    executionControlCenter,
    visionIntegrity,
    builderMonitor,
    etaEngine,
    autonomousRecoveryEngine,
    zeroHumanAutomationEngine,
    founderShellEngine,
  );
  await bridge.initialize();
  builderMonitor.attachSurfaces({
    supervisor,
    cursorBridge: bridge,
    journeySystem,
    executionControlCenter,
    planner,
    etaEngine,
  });
  etaEngine.attachSurfaces({
    supervisor,
    builderMonitor,
    executionControlCenter,
    journeySystem,
    planner,
    memory,
  });
  autonomousRecoveryEngine.attachSurfaces({
    supervisor,
    recoveryDoctrine,
    recoveryManager: recovery,
    builderMonitor,
    etaEngine,
    executionControlCenter,
    journeySystem,
    planner,
  });
  zeroHumanAutomationEngine.attachSurfaces({
    supervisor,
    builderMonitor,
    etaEngine,
    autonomousRecoveryEngine,
    executionControlCenter,
    guardianMonitoring,
    journeySystem,
    planner,
    visionIntegrity,
    cursorBridge: bridge,
  });
  visionIntegrity.attachSurfaces({
    visionSync,
    memory,
    planner,
    executionControlCenter,
    supervisor,
    journeySystem,
  });
  executionControlCenter.attachCoordinationSurfaces({
    planner,
    supervisor,
    cursorBridge: bridge,
    guardianMonitoring,
    performanceGovernance,
    journeySystem,
    visionIntegrity,
    builderMonitor,
    etaEngine,
    autonomousRecoveryEngine,
    zeroHumanAutomationEngine,
  });
  builderMonitor.runAssessment({ missionId: "P6-04" });
  etaEngine.updateEta({ missionId: "P6-05", roadmapItem: "P6-05", trigger: "progress_change" });
  autonomousRecoveryEngine.runAssessment({ missionId: "P6-06", roadmapItem: "P6-06" });
  zeroHumanAutomationEngine.runAssessment({ missionId: "P6-07", roadmapItem: "P6-07" });
  founderShellEngine.attachSurfaces({
    supervisor,
    builderMonitor,
    journeySystem,
    productionMode,
    executionControlCenter,
    zeroHumanAutomation: zeroHumanAutomationEngine,
  });
  founderShellEngine.runAssessment({ missionId: "P7-01", roadmapItem: "P7-01" });
  return { bridge, tc, ux, supervisor, visionSync, contextSync, cursorProtocol, recoveryDoctrine, browserTruth, e2eTesting, journeySystem, brainRuntime, productionMode, durableSessions, guardianMonitoring, scalingArchitecture, performanceGovernance, executionControlCenter, visionIntegrity, builderMonitor, etaEngine, autonomousRecoveryEngine, zeroHumanAutomationEngine, founderShellEngine };
}

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
    const { bridge } = await createTestCursorBridge();

    const result = bridge.processInstruction("Make the homepage pink");
    assert.equal(result.instruction.kind, "ux_change");
    assert.ok(result.mission.tasks.length >= 1);
    assert.ok(result.mission.requiredFiles.some((f) => f.includes("ExecutiveHomePage")));
    assert.equal(result.dispatch.dispatched, true);
    assert.ok(result.dispatch.supervisorMissionId);
    assert.ok(result.mission.artifactPath);
    assert.match(result.mission.formattedDocument, /CURSOR PROTOCOL/);
    assert.match(result.mission.formattedDocument, /RECOVERY DOCTRINE/);
    assert.match(result.mission.formattedDocument, /BROWSER TRUTH/);
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
    const { bridge, tc, ux } = await createTestCursorBridge();

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
    const { bridge, tc, ux } = await createTestCursorBridge();
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });

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
