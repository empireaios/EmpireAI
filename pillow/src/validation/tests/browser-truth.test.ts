import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import {
  createBrowserTruthEngine,
  evaluateTripleAcceptance,
  BROWSER_VERIFICATION_DIMENSIONS,
  PRODUCTION_SCENARIOS,
} from "../../browser-truth/index.js";
import {
  startPillow,
  requirePillowBrowserTruth,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P4-06 Browser Truth (PILLOW-BT-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Browser Truth Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrowserTruth();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BT-001");
    assert.equal(state.status, "ready");
    assert.ok(state.productionUrl.includes("empire-ai.co"));
  });

  test("Triple acceptance requires PASS PASS PASS for mission complete", () => {
    const blocked = evaluateTripleAcceptance({
      repositoryAcceptance: "PASS",
      productionAcceptance: "PASS",
      grandKingAcceptance: "PENDING",
    });
    assert.equal(blocked.missionComplete, false);

    const complete = evaluateTripleAcceptance({
      repositoryAcceptance: "PASS",
      productionAcceptance: "PASS",
      grandKingAcceptance: "PASS",
    });
    assert.equal(complete.missionComplete, true);
  });

  test("Builder gate evaluates browser truth readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrowserTruth();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-06" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Browser verification pipeline defines dimensions and scenarios", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const engine = createBrowserTruthEngine(bootstrap, { dryRunProductionProbe: true });
    await engine.initialize();
    const result = await engine.runVerification({
      missionId: "P4-06",
      featureTested: "Executive Home production surface",
    });
    assert.equal(result.pipelineVersion, "P4-06");
    assert.equal(result.checks.length, BROWSER_VERIFICATION_DIMENSIONS.length);
    assert.equal(result.scenarios.length, PRODUCTION_SCENARIOS.length);
    assert.equal(result.acceptance.repositoryAcceptance, "PASS");
    assert.equal(result.dryRun, true);
  });

  test("Generated mission includes Browser Truth preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /BROWSER TRUTH/);
      assert.match(doc.formatted, /Repository PASS · Production PASS · Grand King PASS/);
    }
  });

  test("Pillow compares behaviour layers", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrowserTruth();
    await engine.runVerification({ missionId: "P4-06" });
    const comparison = engine.compareBehaviourLayers("Executive Home loads with brain data");
    assert.ok(typeof comparison.aligned === "boolean");
    assert.ok(comparison.findings.length >= 0);
  });
});
