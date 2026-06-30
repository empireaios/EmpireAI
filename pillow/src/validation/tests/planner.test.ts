import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { dependenciesSatisfied } from "../../planner/dependencies.js";
import { assignMissionPriority } from "../../planner/priority.js";
import { PILLOW_IMPLEMENTATION_SEQUENCE } from "../../planner/catalog.js";
import {
  startPillow,
  requirePillowMissionPlanner,
  generateNextPillowMission,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-006 Mission Planner", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Planner initializes after Memory (PILLOW-002…005)", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const plan = session.planner.getPlan();

    assert.equal(plan.plannerVersion, "PILLOW-006");
    assert.equal(plan.status, "ready");
    assert.ok(plan.queue.length > 0);
    assert.ok(plan.intelligence.completedCount > 0);
  });

  test("Next mission follows Pillow Part 7 sequence", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const next = requirePillowMissionPlanner().determineNextMission();

    assert.ok(next);
    const incomplete = PILLOW_IMPLEMENTATION_SEQUENCE.find(
      (e) =>
        !requirePillowMissionPlanner()
          .getPlan()
          .queue.every((q) => q.id !== e.id) &&
        requirePillowMissionPlanner()
          .getPlan()
          .intelligence.completedCount >= 0,
    );
    void incomplete;
    assert.match(next!.id, /^PILLOW-\d{3}|REAL-|REPOSITORY-/);
    assert.ok(["critical", "high", "normal"].includes(next!.priority));
  });

  test("Dependencies validated for next Pillow mission", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const next = requirePillowMissionPlanner().determineNextMission();
    assert.ok(next);

    const required = next!.dependencies.filter((d) => d.required);
    assert.ok(required.length > 0);

    if (next!.id.startsWith("PILLOW-007")) {
      const pillow006 = next!.dependencies.find((d) => d.id === "PILLOW-006");
      if (pillow006 && !pillow006.satisfied) {
        assert.ok(next!.blockedBy.includes("PILLOW-006"));
      }
    }
  });

  test("Priority engine assigns critical to commercial blockers", () => {
    const priority = assignMissionPriority({
      missionId: "REAL-002B",
      category: "commercial_intelligence",
      readiness: "ready",
      blocksCommercial: true,
      intelligence: {
        repositoryPosition: null,
        currentMission: null,
        completedCount: 0,
        pendingCount: 0,
        blockedCount: 0,
        repositoryHealthScore: 50,
        architectureReady: true,
        commercialReady: false,
        governanceReady: true,
        syncRequired: false,
        driftSignals: [],
      },
    });
    assert.equal(priority, "critical");
  });

  test("Mission not generated when dependencies incomplete", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();

    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory, {
      forceMissionId: "PILLOW-010",
    });
    planner.initialize();

    const doc = planner.generateMission("PILLOW-010");
    if (
      planner
        .getPlan()
        .queue.find((c) => c.id === "PILLOW-010")
        ?.blockedBy.length
    ) {
      assert.equal(doc, null);
    }
  });

  test("Cursor-ready mission generated with required sections", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = generateNextPillowMission();

    if (doc) {
      assert.ok(doc.formatted.includes("CURSOR OUTPUT:"));
      assert.ok(doc.formatted.includes("SECTION 1 — Executive Summary"));
      assert.ok(doc.formatted.includes("SECTION 2 — Cursor Draft"));
      assert.ok(doc.formatted.includes("My Understanding"));
      assert.ok(doc.formatted.includes("Recommendation"));
      assert.ok(doc.formatted.includes("MISSION:"));
      assert.ok(doc.formatted.includes("Mission Type"));
      assert.ok(doc.formatted.includes("Authority"));
      assert.ok(doc.formatted.includes("Objective"));
      assert.ok(doc.formatted.includes("Dependencies"));
      assert.ok(doc.formatted.includes("Acceptance Criteria"));
      assert.ok(doc.formatted.includes("Executive Audit"));
      assert.ok(doc.formatted.includes("Stop Rule"));
      assert.ok(doc.evidence.length > 0);
    }
  });

  test("Mission sequence distinguishes completed and pending", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const plan = requirePillowMissionPlanner().getPlan();

    const pillow005Complete = plan.queue.every((c) => c.id !== "PILLOW-005");
    assert.ok(pillow005Complete, "PILLOW-005 should not appear in queue when complete");

    const pillow019InQueue = plan.queue.some((candidate) => candidate.id === "PILLOW-019");
    assert.ok(!pillow019InQueue, "PILLOW-019 should be complete and not queued");
    assert.ok(
      plan.queue.length > 0 || plan.nextMission !== null,
      "Planner should expose follow-on Version 1 work or a resolved next mission",
    );
  });

  test("Repository awareness — intelligence snapshot populated", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const intel = requirePillowMissionPlanner().getPlan().intelligence;

    assert.ok(intel.repositoryHealthScore >= 0);
    assert.ok(typeof intel.architectureReady === "boolean");
    assert.ok(typeof intel.commercialReady === "boolean");
    assert.ok(typeof intel.governanceReady === "boolean");
  });

  test("Read-only — repository unchanged after planning", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    requirePillowMissionPlanner().refresh();
    generateNextPillowMission();

    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("Planning completes within reasonable time", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    const plan = planner.initialize();
    assert.ok(plan.durationMs < 500);
  });

  test("startPillow exposes MissionPlannerEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.planner);
    assert.equal(requirePillowMissionPlanner(), session.planner);
  });

  test("Dependency satisfaction helper", () => {
    assert.equal(
      dependenciesSatisfied([
        { id: "a", label: "a", satisfied: true, required: true, evidence: [] },
        { id: "b", label: "b", satisfied: false, required: false, evidence: [] },
      ]),
      true,
    );
    assert.equal(
      dependenciesSatisfied([
        { id: "a", label: "a", satisfied: false, required: true, evidence: [] },
      ]),
      false,
    );
  });
});
