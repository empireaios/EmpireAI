import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CORE_CAPABILITIES,
  REASONING_MODES,
  buildCollectiveReasoningEngineConfiguration,
  createCollectiveReasoningEngine,
  resetCollectiveReasoningEngineForTesting,
} from "../../collective-reasoning-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCollectiveReasoningEngine(bootstrap);
  await engine.initialize();
  engine.connectCollectiveReasoningEngine();
  return engine;
}

describe("Q0-13 Collective Reasoning Engine", () => {
  beforeEach(resetCollectiveReasoningEngineForTesting);

  test("1 locks mandatory collective-reasoning-engine boundaries", () => {
    const c = buildCollectiveReasoningEngineConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverAssignWorkersPermanently: false as never,
      neverReplacePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverApproveActions: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverAssignWorkersPermanently, true);
    assert.equal(c.neverReplacePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverApproveActions, true);
  });

  test("2 initializes PILLOW-CORE-001 for Q0-13", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-13");
    assert.equal(state.engineVersion, "PILLOW-CORE-001");
    for (const mode of REASONING_MODES) {
      assert.ok(state.configuration.supportedModes.includes(mode));
    }
  });

  test("3 receives executive question and identifies required expertise", async () => {
    const report = (await build()).identifyExpertise({
      executiveQuestion: "Should we accelerate engineering delivery despite security and compliance risk?",
      validated: true,
    });
    assert.ok(report.requiredExpertise.length >= 2);
    assert.ok(report.requiredExpertise.includes("engineering") || report.requiredExpertise.includes("security"));
  });

  test("4 assembles a multi-worker reasoning panel", async () => {
    const report = (await build()).assemblePanel({
      executiveQuestion: "Should we accelerate engineering delivery despite security and compliance risk?",
      validated: true,
    });
    assert.ok(report.participants.length >= 2);
    assert.ok(report.participants.some((p) => p.stanceBias === "challenging"));
  });

  test("5 collects independent opinions and detects conflicts", async () => {
    const record = (await build()).collectOpinions({
      executiveQuestion: "Should we accelerate engineering delivery despite security and compliance risk?",
      businessContext: "high-stakes product launch",
      validated: true,
    }).records[0]!;
    assert.ok(record.independentOpinions.length >= 2);
    assert.ok(record.conflictsDetected >= 1);
    assert.equal(record.workExecuted, false);
  });

  test("6 coordinates debate, challenges, consensus, and minority opinions", async () => {
    const record = (await build()).debate({
      executiveQuestion: "Should we accelerate engineering delivery despite security and compliance risk?",
      validated: true,
    }).records[0]!;
    assert.ok(record.challengesRaised.length >= 1);
    assert.ok(record.consensusPosition.length > 0);
    assert.ok(Array.isArray(record.minorityOpinions));
    assert.ok(record.debateSummary.toLowerCase().includes("debate"));
  });

  test("7 produces final recommendation and machine-readable reasoning record", async () => {
    const record = (await build()).recommend({
      executiveQuestion: "Should we accelerate engineering delivery despite security and compliance risk?",
      validated: true,
    }).records[0]!;
    assert.ok(record.reasoningId.startsWith("core-rsn-"));
    assert.ok(record.recommendedAction.length > 0);
    assert.ok(record.confidenceScore >= 0 && record.confidenceScore <= 100);
    assert.equal(record.metadataVersion, "CORE-001-v1");
    assert.equal(record.neverApproveActions, true);
    assert.equal(record.actionsApproved, false);
  });

  test("8 rejects execute / permanent assign / replace Pillow / Grand King / approve boundaries", async () => {
    const engine = await build();
    const base = {
      executiveQuestion: "Should we accelerate engineering delivery despite security risk?",
      validated: true as const,
    };
    assert.equal(engine.reason({ ...base, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.reason({ ...base, assignWorkersPermanently: true }).validation.decision, "fail");
    assert.equal(engine.reason({ ...base, replacePillow: true }).validation.decision, "fail");
    assert.equal(engine.reason({ ...base, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.reason({ ...base, approveActions: true }).validation.decision, "fail");
  });

  test("9 supports extensible reasoning modes", async () => {
    const engine = createCollectiveReasoningEngine(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { supportedModes: [...REASONING_MODES, "red_team_simulation"] } },
    );
    await engine.initialize();
    engine.connectCollectiveReasoningEngine();
    assert.ok(engine.getState().configuration.supportedModes.includes("red_team_simulation"));
    assert.ok(CORE_CAPABILITIES.includes("extensible_reasoning_modes"));
    const record = engine.reason({
      executiveQuestion: "Evaluate finance and data tradeoffs for a phased expansion decision",
      validated: true,
    }).records[0]!;
    assert.ok(record.participants.length >= 2);
    assert.ok(record.modesApplied.includes("independent_analysis"));
  });

  test("10 validates stored reasoning records", async () => {
    const engine = await build();
    engine.reason({
      executiveQuestion: "Should product and operations jointly phase the next release?",
      validated: true,
    });
    const validation = engine.validateReasoning({ executiveQuestion: "", validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
