import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EXPERIENCE_SOURCES,
  XPL_CAPABILITIES,
  buildExperienceReplayEngineConfiguration,
  createExperienceReplayEngine,
  resetExperienceReplayEngineForTesting,
} from "../../experience-replay-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExperienceReplayEngine(bootstrap);
  await engine.initialize();
  engine.connectExperienceReplayEngine();
  return engine;
}

describe("Q0-14 Experience Replay Engine", () => {
  beforeEach(resetExperienceReplayEngineForTesting);

  test("1 locks mandatory experience-replay-engine boundaries", () => {
    const c = buildExperienceReplayEngineConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverReplaceExecutionMemory: false as never,
      neverReplaceDecisionEngine: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverReplaceExecutionMemory, true);
    assert.equal(c.neverReplaceDecisionEngine, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-XPL-001 for Q0-14", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-14");
    assert.equal(state.engineVersion, "PILLOW-XPL-001");
    for (const source of EXPERIENCE_SOURCES) {
      assert.ok(state.configuration.experienceSources.includes(source));
    }
  });

  test("3 replays successful missions into experience records", async () => {
    const report = (await build()).analyseSuccess({ validated: true });
    assert.ok(report.records.length >= 1);
    assert.ok(report.records.every((r) => r.outcome === "success"));
    assert.ok(report.records[0]!.successFactors.length >= 1);
    assert.equal(report.records[0]!.workExecuted, false);
  });

  test("4 replays failed missions and detects recurring mistakes", async () => {
    const report = (await build()).analyseFailure({ validated: true });
    assert.ok(report.records.length >= 1);
    assert.ok(report.repeatedMistakes.length >= 1);
    assert.ok(
      report.repeatedMistakes.some(
        (m) => m.pattern.includes("incomplete_evidence") || m.pattern.includes("missing_rejection_context"),
      ),
    );
  });

  test("5 learns from Grand King feedback and rejections", async () => {
    const engine = await build();
    const rejected = engine.analyseRejection({ validated: true }).records;
    assert.ok(rejected.length >= 1);
    assert.ok(rejected.some((r) => r.outcome === "rejected"));

    const gk = engine.analyseGrandKingFeedback({ validated: true });
    assert.ok(gk.history.every((h) => Boolean(h.grandKingFeedback)));
    assert.ok(gk.lessons.some((l) => l.category === "rejection" || l.category === "correction"));
  });

  test("6 extracts reusable lessons and future behaviour recommendations", async () => {
    const report = (await build()).extractLessons({
      replayScope: "q0-executive-learning",
      validated: true,
    });
    assert.ok(report.lessons.length >= 1);
    const record = report.records[0]!;
    assert.ok(record.lessonsLearned.length >= 1);
    assert.ok(record.recommendedFutureBehaviour.length > 0);
    assert.equal(record.metadataVersion, "XPL-001-v1");
  });

  test("7 produces machine-readable experience records from full replay", async () => {
    const record = (await build()).replayExperience({ validated: true }).records[0]!;
    assert.ok(record.experienceId.startsWith("xpl-exp-"));
    assert.ok(record.missionId);
    assert.ok(record.businessId);
    assert.ok(record.eventType);
    assert.ok(Array.isArray(record.supportingEvidence));
    assert.equal(record.neverReplaceExecutionMemory, true);
    assert.equal(record.executionMemoryReplaced, false);
  });

  test("8 rejects execute / replace memory / replace decision / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = { validated: true as const };
    assert.equal(engine.replayExperience({ ...base, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.replayExperience({ ...base, replaceExecutionMemory: true }).validation.decision, "fail");
    assert.equal(engine.replayExperience({ ...base, replaceDecisionEngine: true }).validation.decision, "fail");
    assert.equal(engine.replayExperience({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.replayExperience({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports extensible experience sources", async () => {
    const engine = createExperienceReplayEngine(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { experienceSources: [...EXPERIENCE_SOURCES, "simulation_outcomes"] } },
    );
    await engine.initialize();
    engine.connectExperienceReplayEngine();
    assert.ok(engine.getState().configuration.experienceSources.includes("simulation_outcomes"));
    assert.ok(XPL_CAPABILITIES.includes("extensible_experience_sources"));
    const report = engine.detectPatterns({ validated: true });
    assert.ok(report.records[0]!.patternsIdentified.length >= 1);
  });

  test("10 validates stored experience records", async () => {
    const engine = await build();
    engine.recommendFutureBehaviour({ validated: true });
    const validation = engine.validateExperience({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.ok(engine.getRecords().length >= 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
