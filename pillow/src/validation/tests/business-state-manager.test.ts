import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BSM_CAPABILITIES,
  buildBusinessStateManagerConfiguration,
  createBusinessStateManager,
  resetBusinessStateManagerForTesting,
} from "../../business-state-manager/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBusinessStateManager(bootstrap);
  await engine.initialize();
  engine.connectBusinessStateManager();
  return engine;
}

describe("Q0-03 Business State Manager", () => {
  beforeEach(resetBusinessStateManagerForTesting);

  test("1 locks mandatory state-manager boundaries", () => {
    const c = buildBusinessStateManagerConfiguration(REPO_ROOT, {
      neverExecuteMissions: false as never,
      neverAssignWorkers: false as never,
      neverApproveActions: false as never,
      neverLaunchBusinesses: false as never,
      neverMakeStrategicDecisions: false as never,
    });
    assert.equal(c.neverExecuteMissions, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverApproveActions, true);
    assert.equal(c.neverLaunchBusinesses, true);
    assert.equal(c.neverMakeStrategicDecisions, true);
  });

  test("2 initializes PILLOW-BSM-001 for Q0-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-03");
    assert.equal(state.engineVersion, "PILLOW-BSM-001");
  });

  test("3 registers a business into the live registry", async () => {
    const report = (await build()).registerBusiness({
      name: "Aurora Retail Co",
      category: "commerce",
      businessType: "dtc",
      owner: "grand-king",
      validated: true,
      dependencies: {
        requiredInfrastructure: ["edge-cdn"],
        requiredApis: ["payments-api"],
        requiredWorkforceCategories: ["engineering"],
        requiredApprovals: ["executive-acceptance"],
      },
    });
    assert.equal(report.validation.decision, "pass");
    const biz = report.businesses[0]!;
    assert.ok(biz.businessId.startsWith("bsm-biz-"));
    assert.equal(biz.currentState, "planned");
    assert.equal(biz.healthStatus, "healthy");
    assert.equal(biz.metadataVersion, "BSM-001-v1");
  });

  test("4 updates lifecycle state and phase", async () => {
    const engine = await build();
    const registered = engine.registerBusiness({ name: "Northwind Ops", validated: true }).businesses[0]!;
    const updated = engine.updateBusinessState({
      businessId: registered.businessId,
      currentState: "building",
      validated: true,
    }).businesses[0]!;
    assert.equal(updated.currentState, "building");
    assert.equal(updated.currentPhase, "construction");
    assert.equal(updated.version, 2);
  });

  test("5 updates health and progress", async () => {
    const engine = await build();
    const biz = engine.registerBusiness({ name: "Helios Media", validated: true }).businesses[0]!;
    const health = engine.updateBusinessHealth({
      businessId: biz.businessId,
      healthStatus: "warning",
      validated: true,
    }).businesses[0]!;
    assert.equal(health.healthStatus, "warning");
    const progress = engine.updateBusinessProgress({
      businessId: biz.businessId,
      activeMissions: ["m-1"],
      completedMissions: ["m-0"],
      pendingApprovals: ["ap-1"],
      blockers: ["missing-api"],
      validated: true,
    }).businesses[0]!;
    assert.equal(progress.progressSummary.activeMissions, 1);
    assert.equal(progress.progressSummary.completedMissions, 1);
    assert.equal(progress.progressSummary.pendingApprovals, 1);
    assert.equal(progress.progressSummary.currentBlockers, 1);
  });

  test("6 queries business status", async () => {
    const engine = await build();
    const a = engine.registerBusiness({ name: "Alpha", category: "saas", currentState: "operating", validated: true }).businesses[0]!;
    const beta = engine.registerBusiness({
      name: "Beta",
      category: "saas",
      currentState: "paused",
      healthStatus: "critical",
      validated: true,
    });
    assert.equal(beta.validation.decision, "pass");
    assert.equal(beta.businesses[0]!.healthStatus, "critical");
    const byId = engine.queryBusinessState({ businessId: a.businessId, validated: true });
    assert.equal(byId.businesses.length, 1);
    assert.equal(byId.businesses[0]!.name, "Alpha");
    const byHealth = engine.queryBusinessState({ healthStatus: "critical", validated: true });
    assert.equal(byHealth.businesses.length, 1);
    assert.equal(byHealth.businesses[0]!.name, "Beta");
  });

  test("7 rejects boundary violations", async () => {
    const engine = await build();
    assert.equal(engine.registerBusiness({ name: "X", validated: true, executeMissions: true }).validation.decision, "fail");
    assert.equal(engine.registerBusiness({ name: "X", validated: true, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.registerBusiness({ name: "X", validated: true, approveActions: true }).validation.decision, "fail");
    assert.equal(engine.registerBusiness({ name: "X", validated: true, launchBusinesses: true }).validation.decision, "fail");
    assert.equal(engine.registerBusiness({ name: "X", validated: true, makeStrategicDecisions: true }).validation.decision, "fail");
  });

  test("8 preserves boundary flags and traceability on records", async () => {
    const biz = (await build()).registerBusiness({ name: "Traceable Co", validated: true }).businesses[0]!;
    assert.equal(biz.neverExecuteMissions, true);
    assert.equal(biz.missionsExecuted, false);
    assert.equal(biz.workersAssigned, false);
    assert.equal(biz.actionsApproved, false);
    assert.equal(biz.businessLaunchedByManager, false);
    assert.equal(biz.strategicDecisionMade, false);
    assert.ok(biz.stateTraceId.startsWith("bsm-trace-"));
    assert.equal(biz.preserveAuditability, true);
  });

  test("9 validates registry consistency", async () => {
    const engine = await build();
    engine.registerBusiness({ name: "Consistency One", validated: true });
    assert.equal(engine.validateConsistency().validation.decision, "pass");
    assert.equal(engine.listBusinesses().businesses.length, 1);
  });

  test("10 reports health and diagnostics", async () => {
    const engine = await build();
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.equal(engine.getCockpitSnapshot().neverLaunchBusinesses, true);
    assert.ok(BSM_CAPABILITIES.includes("maintain_live_business_registry"));
  });
});
