import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  createInfrastructureCommanderEngine,
  orchestrateGitHub,
  buildMonitorSnapshot,
  coordinateRecovery,
} from "../../infrastructure-commander/index.js";
import {
  startPillow,
  requirePillowInfrastructureCommander,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 6 Infrastructure Commander (PILLOW-IC-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Infrastructure Commander initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const commander = requirePillowInfrastructureCommander();
    const state = commander.getState();
    assert.equal(state.commanderVersion, "PILLOW-IC-001");
    assert.equal(state.status, "ready");
    assert.equal(state.platformsMonitored.length, 4);
  });

  test("GitHub orchestration reads repository state", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const github = orchestrateGitHub(bootstrap);
    assert.equal(github.platform, "github");
    assert.ok(github.branch);
    assert.ok(github.recentCommits.length >= 1);
  });

  test("Full infrastructure scan probes live platforms", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const commander = createInfrastructureCommanderEngine(bootstrap);
    await commander.initialize();

    const snapshot = await commander.scanInfrastructure();
    assert.ok(["healthy", "degraded", "critical", "unknown"].includes(snapshot.overallHealth));
    assert.ok(snapshot.railway.serviceUrl.includes("railway"));
    assert.ok(snapshot.vercel.productionUrl.includes("empire"));
    assert.equal(snapshot.application.endpoints.length, 3);
  });

  test("Recovery coordination produces automated steps", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const github = orchestrateGitHub(bootstrap);
    const snapshot = buildMonitorSnapshot({
      github,
      railway: {
        platform: "railway",
        serviceUrl: "https://empireai-production.up.railway.app",
        healthEndpoint: "critical",
        brainOnline: false,
        pillowHealth: "critical",
        responseMs: null,
        deploymentNotes: [],
        restartStrategy: "",
        rollbackPlan: "",
        health: "critical",
        findings: ["Railway down"],
      },
      vercel: {
        platform: "vercel",
        productionUrl: "https://empire-ai.co",
        frontendReachable: true,
        bffHealth: "healthy",
        pillowProxyOk: true,
        routingNotes: [],
        buildValidation: "healthy",
        health: "healthy",
        findings: [],
      },
      application: {
        platform: "application",
        endpoints: [],
        certificateOk: true,
        serviceAvailability: "degraded",
        health: "degraded",
        findings: [],
      },
    });

    const plan = coordinateRecovery("Railway deployment failed", snapshot);
    assert.equal(plan.category, "deployment");
    assert.ok(plan.automatedSteps.length >= 2);
    assert.ok(plan.rollbackSteps.length >= 1);
  });

  test("Executive report includes all platform summaries", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const commander = requirePillowInfrastructureCommander();
    await commander.scanInfrastructure();
    const report = await commander.generateExecutiveReport();
    assert.equal(report.version, "PILLOW-IC-001");
    assert.ok(report.githubSummary);
    assert.ok(report.railwaySummary);
    assert.ok(report.vercelSummary);
    assert.ok(report.recommendedActions.length >= 1);
    assert.match(report.executiveBrief, /Infrastructure Commander/i);
  });

  test("Context builder attaches infrastructureBrief", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const commander = createInfrastructureCommanderEngine(bootstrap);
    await commander.initialize();

    const task = detectContextTask("What is the infrastructure status?");
    assert.equal(task, "infrastructure");

    const context = await runContextBuild(
      bootstrap,
      intelligence,
      { userMessage: "What is the infrastructure status?" },
      {},
      undefined,
      undefined,
      undefined,
      commander,
    );

    assert.ok(context.infrastructureBrief);
    assert.match(context.infrastructureBrief!, /PILLOW-IC-001/i);
  });
});
