import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  SESSION_LAYER_REGISTRY,
  SESSION_DOMAINS,
  SESSION_LIFECYCLE_STATES,
  PERSISTENCE_MODEL_REGISTRY,
  executeSessionRecovery,
  validateSessionIntegrity,
  buildDefaultSessionSnapshot,
} from "../../durable-sessions/index.js";
import {
  startPillow,
  requirePillowDurableSessions,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-03 Durable Session Architecture (PILLOW-DS-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Durable Session Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDurableSessions();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-DS-001");
    assert.equal(state.status, "ready");
  });

  test("Session layer registry covers all governed domains", () => {
    assert.ok(SESSION_LAYER_REGISTRY.length >= 11);
    assert.ok(SESSION_DOMAINS.length >= 10);
    assert.ok(SESSION_LIFECYCLE_STATES.length >= 8);
    for (const layer of SESSION_LAYER_REGISTRY) {
      assert.ok(layer.purpose);
      assert.ok(layer.persistence);
      assert.ok(layer.recoveryStrategy);
      assert.ok(layer.securityControls.length > 0);
    }
  });

  test("Persistence models documented", () => {
    assert.ok(PERSISTENCE_MODEL_REGISTRY.length >= 7);
    for (const model of PERSISTENCE_MODEL_REGISTRY) {
      assert.ok(model.mechanism);
      assert.ok(model.expirationPolicy);
      assert.ok(model.cleanupPolicy);
    }
  });

  test("Builder gate evaluates session architecture readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDurableSessions();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-03", roadmapItem: "P5-03" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Session recovery validates integrity and executes per layer", () => {
    const snapshot = buildDefaultSessionSnapshot();
    snapshot.coiRuntimeReady = true;
    snapshot.pillowHostRunning = true;
    snapshot.browserSessionPersisted = true;
    const integrity = validateSessionIntegrity(snapshot);
    assert.equal(integrity.valid, true);
    const recovery = executeSessionRecovery({ snapshot });
    assert.ok(recovery.length >= 11);
    assert.ok(recovery.some((r) => r.layerId === "DS-BROWSER" && r.resumed));
  });

  test("Grand King acceptance — continuity scenarios handled", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDurableSessions();
    const continuity = engine.verifyGrandKingContinuity();
    assert.equal(continuity.complete, true);
    assert.ok(continuity.layerCount >= 11);
    assert.ok(continuity.persistenceCount >= 7);
    const scenarios = continuity.continuityScenarios.map((s) => s.scenario);
    assert.ok(scenarios.includes("Browser refresh"));
    assert.ok(scenarios.includes("Brain restart"));
    assert.ok(scenarios.includes("Worker recovery"));
    assert.ok(scenarios.includes("Queue recovery"));
    assert.match(continuity.assessment.grandKingSummary, /Durable:/);
  });

  test("Generated mission includes Durable Session preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /DURABLE SESSION ARCHITECTURE/);
      assert.match(doc.formatted, /constitutional runtime capability/i);
    }
  });

  test("Pillow analyzes session health", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowDurableSessions();
    engine.runAssessment();
    const analysis = engine.analyzeSessionHealth();
    assert.ok(analysis.recommendations.length > 0);
  });
});
