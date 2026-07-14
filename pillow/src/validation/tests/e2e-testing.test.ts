import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import {
  createE2eTestingEngine,
  MANDATORY_E2E_JOURNEYS,
  JOURNEY_REGISTRY,
  CRITICAL_JOURNEY_IDS,
  getCriticalJourneys,
  evaluateFailurePolicy,
} from "../../e2e-testing/index.js";
import {
  startPillow,
  requirePillowE2eTesting,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const GRAND_KING_WORKFLOWS = [
  "login",
  "executive_home",
  "pillow_chat",
  "builder",
  "supervisor",
  "journey",
  "business_dashboard",
] as const;

describe("P4-07 End-to-End Testing (PILLOW-E2E-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("E2E Testing Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowE2eTesting();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-E2E-001");
    assert.equal(state.status, "ready");
  });

  test("Journey registry covers all mandatory E2E journeys", () => {
    assert.equal(JOURNEY_REGISTRY.length, MANDATORY_E2E_JOURNEYS.length);
    for (const id of MANDATORY_E2E_JOURNEYS) {
      assert.ok(JOURNEY_REGISTRY.some((j) => j.id === id), `Missing journey: ${id}`);
    }
  });

  test("Critical journeys registered for Grand King acceptance", () => {
    const critical = getCriticalJourneys();
    for (const id of CRITICAL_JOURNEY_IDS) {
      assert.ok(critical.some((j) => j.id === id), `Missing critical journey: ${id}`);
    }
  });

  test("Builder gate evaluates E2E testing readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowE2eTesting();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-07", roadmapItem: "P4-07" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("E2E suite validates Grand King critical workflows (dry-run)", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const engine = createE2eTestingEngine(bootstrap, { dryRunExecution: true });
    await engine.initialize();
    const result = await engine.runSuite({
      missionId: "P4-07",
      roadmapItem: "P4-07",
      dryRun: true,
    });
    assert.equal(result.pipelineVersion, "P4-07");
    assert.equal(result.dryRun, true);
    assert.equal(result.browserTruthAuthority, "P4-06 remains final acceptance authority");

    for (const workflow of GRAND_KING_WORKFLOWS) {
      const journey = result.journeys.find((j) => j.id === workflow);
      assert.ok(journey, `Grand King workflow missing: ${workflow}`);
      assert.notEqual(journey!.verdict, "FAIL", `${workflow} must not fail in dry-run`);
    }

    assert.equal(result.success, true);
    assert.ok(result.passRate > 0);
  });

  test("Failure policy blocks production acceptance on critical failure", () => {
    const policy = evaluateFailurePolicy([
      {
        id: "login",
        label: "Login",
        critical: true,
        verdict: "FAIL",
        detail: "Simulated failure",
        evidence: [],
      },
    ]);
    assert.equal(policy.blockProductionAcceptance, true);
    assert.equal(policy.notifySupervisor, true);
    assert.equal(policy.notifyPillow, true);
    assert.equal(policy.preventMissionCompletion, true);
  });

  test("Generated mission includes E2E Testing preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /END-TO-END TESTING/);
      assert.match(doc.formatted, /Browser Truth \(P4-06\) remains the final production acceptance authority/);
    }
  });

  test("Pillow analyzes testing health", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowE2eTesting();
    await engine.runSuite({ missionId: "P4-07", dryRun: true });
    const analysis = engine.analyzeTestingHealth();
    assert.ok(Array.isArray(analysis.recommendations));
    assert.ok(analysis.recommendations.some((r) => r.includes("Browser Truth")));
  });
});
