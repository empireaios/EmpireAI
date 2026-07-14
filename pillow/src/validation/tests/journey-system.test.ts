import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  createJourneySystemEngine,
  JOURNEY_MODEL,
  MISSION_TRACEABILITY_FIELDS,
  JOURNEY_RELATIONSHIP_CHAIN,
} from "../../journey-system/index.js";
import { generateCursorMission } from "../../planner/generator.js";
import {
  startPillow,
  requirePillowJourneySystem,
  resetPillowSession,
  requirePillowMissionPlanner,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P4-08 Journey System (PILLOW-JR-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Journey System Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowJourneySystem();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-JR-001");
    assert.equal(state.status, "ready");
  });

  test("Journey model and traceability fields registered", () => {
    assert.ok(JOURNEY_MODEL.length >= 14);
    assert.ok(MISSION_TRACEABILITY_FIELDS.length >= 20);
    assert.ok(JOURNEY_RELATIONSHIP_CHAIN.length >= 10);
  });

  test("Builder gate evaluates journey readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowJourneySystem();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-08", roadmapItem: "P4-08" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — end-to-end trace from one Journey record", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowJourneySystem();
    const planner = requirePillowMissionPlanner();
    const next = planner.determineNextMission();
    assert.ok(next, "Expected a next mission from planner");

    const document = generateCursorMission(next);
    const trace = engine.traceEndToEnd(document, "P4-08 — Journey");

    assert.equal(trace.pipelineVersion, "P4-08");
    assert.equal(trace.complete, true);
    assert.ok(trace.chain.every((c) => c.present), "All relationship links must be present");

    const requiredLinks = ["vision", "roadmap_item", "builder_mission", "repository_commit", "evidence"];
    for (const link of requiredLinks) {
      const found = trace.chain.find((c) => c.link === link);
      assert.ok(found?.present, `Missing link: ${link}`);
    }

    assert.ok(trace.record.missions.length > 0);
    assert.ok(trace.record.timeline.length > 0);
    assert.ok(trace.record.lessonsLearned.length > 0);
    assert.match(trace.summary, /no manual reconstruction/i);
  });

  test("Builder records mission in permanent Journey", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowJourneySystem();
    const planner = requirePillowMissionPlanner();
    const next = planner.determineNextMission();
    if (!next) return;
    const document = generateCursorMission(next);
    const trace = engine.recordMission(document, "P4-08");
    assert.equal(trace.missionId, document.missionId);
    assert.ok(trace.journeyId.startsWith("JR-"));
    const active = engine.getActiveJourney();
    assert.ok(active);
    assert.equal(active!.missions.length, 1);
  });

  test("Generated mission includes Journey System preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /JOURNEY SYSTEM/);
      assert.match(doc.formatted, /permanent execution history/i);
    }
  });

  test("Pillow analyzes journey governance", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowJourneySystem();
    const planner = requirePillowMissionPlanner();
    const next = planner.determineNextMission();
    if (next) {
      engine.recordMission(generateCursorMission(next), "P4-08");
    }
    const analysis = engine.analyzeJourneyGovernance();
    assert.ok(Array.isArray(analysis.recommendations));
    assert.ok(analysis.recommendations.length > 0);
  });
});
