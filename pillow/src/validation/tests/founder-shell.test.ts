import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import { startPillow, requirePillowFounderShellEngine, resetPillowSession } from "../../session.js";
import {
  FOUNDER_NAVIGATION_REGISTRY,
  FOUNDER_WORKSPACE_REGISTRY,
} from "../../founder-shell/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("PILLOW-FS-001 Founder Shell (P7-01 · P7-02)", () => {
  before(async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
  });

  after(async () => {
    resetPillowSession();
  });

  test("engine initializes with doctrine and navigation registry", async () => {
    const engine = requirePillowFounderShellEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FS-001");
    assert.equal(state.status, "ready");
    assert.ok(state.workspaceCount >= 12);
    assert.equal(state.navigationCount, 12);
  });

  test("readiness pipeline passes for P7-01", async () => {
    const engine = requirePillowFounderShellEngine();
    const pipeline = await engine.refreshReadiness({ missionId: "P7-01", roadmapItem: "P7-01" });
    assert.equal(pipeline.pipelineVersion, "P7-01");
    assert.ok(pipeline.readinessScore >= 75);
    assert.equal(pipeline.navigationReady, true);
    assert.equal(pipeline.workspacesReady, true);
  });

  test("builder gate allows founder shell execution", () => {
    const engine = requirePillowFounderShellEngine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P7-01", roadmapItem: "P7-01" });
    assert.equal(gate.allowed, true);
    assert.ok(gate.readinessScore >= 75);
  });

  test("navigation registry covers mission-required workspaces", () => {
    assert.equal(FOUNDER_NAVIGATION_REGISTRY.length, 12);
    const labels = FOUNDER_NAVIGATION_REGISTRY.map((n) => n.label);
    assert.ok(labels.includes("Executive Home"));
    assert.ok(labels.includes("Mission Centre"));
    assert.ok(labels.includes("Pillow Centre"));
    assert.ok(labels.includes("Builder Console"));
    assert.ok(labels.includes("Supervisor Centre"));
    assert.ok(labels.includes("Journey Centre"));
    assert.ok(labels.includes("Production Centre"));
    assert.ok(labels.includes("Guardian Centre"));
    assert.ok(labels.includes("Business Centre"));
    assert.ok(labels.includes("Commerce Centre"));
    assert.ok(labels.includes("Knowledge Centre"));
    assert.ok(labels.includes("Settings"));
  });

  test("workspace registry includes mission centre and notifications", () => {
    const ids = FOUNDER_WORKSPACE_REGISTRY.map((w) => w.id);
    assert.ok(ids.includes("mission_centre"));
    assert.ok(ids.includes("notifications"));
    assert.ok(ids.includes("pillow_workspace"));
    assert.ok(ids.includes("builder_workspace"));
  });

  test("cockpit snapshot provides executive home summary", () => {
    const engine = requirePillowFounderShellEngine();
    engine.runAssessment({ missionId: "P7-01", roadmapItem: "P7-01" });
    const snapshot = engine.getCockpitSnapshot();
    assert.equal(snapshot.shellHealth, "healthy");
    assert.ok(snapshot.navigation.length >= 9);
    assert.ok(snapshot.workspaces.length >= 11);
    assert.ok(snapshot.executiveHome.missionStatus);
    assert.ok(snapshot.executiveHome.builderStatus);
    assert.ok(snapshot.grandKingSummary.includes("Founder Shell"));
    assert.equal(snapshot.cockpitIntegrated, true);
  });

  test("context sync preserves founder context fields", () => {
    const engine = requirePillowFounderShellEngine();
    const context = engine.syncFromRuntime("pillow_workspace");
    assert.equal(context.currentWorkspace, "pillow_workspace");
    assert.ok("currentMission" in context);
    assert.ok("currentJourney" in context);
    assert.ok(Array.isArray(context.currentRecommendations));
  });

  test("mission preamble includes P7-01 founder shell block", () => {
    const engine = requirePillowFounderShellEngine();
    const preamble = engine.formatMissionPreamble({ missionId: "P7-01", roadmapItem: "P7-01" });
    assert.match(preamble, /FOUNDER SHELL \(P7-01/);
    assert.match(preamble, /Readiness:/);
  });
});
