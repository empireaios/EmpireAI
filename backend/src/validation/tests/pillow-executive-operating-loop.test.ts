import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { ALL_CAPABILITY_SCENARIOS } from "../../orchestration/pillow-commissioning/executive-operating-loop/capability-scenarios.js";
import { runPillowCapabilityTests } from "../../orchestration/pillow-commissioning/executive-operating-loop/capability-harness.js";
import { runExecutiveOperatingCycle } from "../../orchestration/pillow-commissioning/executive-operating-loop/cycle-runner.js";
import { investigateLogisticsAlternatives } from "../../orchestration/pillow-commissioning/executive-operating-loop/logistics-investigation.js";
import { evaluateExecutiveBirthReadiness } from "../../orchestration/pillow-commissioning/executive-operating-loop/birth-readiness.js";
import {
  getCurrentObjective,
  getLatestExecutiveCycle,
} from "../../orchestration/pillow-commissioning/executive-operating-loop/store.js";

describe("Pillow executive operating loop", () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = `:memory:pillow-exec-loop-${process.pid}-${Date.now()}`;
    process.env.GUARDIAN_ENABLED = "true";
    resetDatabaseInstance();
  });

  afterEach(() => {
    resetDatabaseInstance();
  });

  it("executes full stage loop without LLM on a logistics-weak situation", () => {
    const cycle = runExecutiveOperatingCycle({
      workspaceId: "test-exec-loop-logistics",
      situation: ALL_CAPABILITY_SCENARIOS.A,
      mode: "sandbox",
      persist: false,
      recordFlight: false,
    });
    const stages = cycle.stages.map((s) => s.stage);
    for (const required of [
      "OBSERVE",
      "DIAGNOSE",
      "CRITIQUE",
      "GENERATE_ALTERNATIVES",
      "INVESTIGATE",
      "COMPARE",
      "DECIDE",
      "ACT_WITHIN_AUTHORITY",
      "MONITOR",
      "LEARN",
      "UPDATE_STRATEGY",
      "CONTINUE",
    ]) {
      assert.ok(stages.includes(required as (typeof stages)[number]), `missing ${required}`);
    }
    assert.equal(cycle.llmCallsUsed, 0);
    assert.ok(cycle.cheapOperationsUsed >= 6);
    assert.ok(cycle.hypotheses.some((h) => h.kind === "logistics_fulfilment"));
    assert.match(cycle.decision.disposition, /LOGISTICS|INVESTIGATE/);
  });

  it("does not hard-code CJ US warehouse as the logistics answer", () => {
    const result = investigateLogisticsAlternatives(ALL_CAPABILITY_SCENARIOS.A);
    assert.equal(result.hardCodedUsWarehouse, false);
    assert.ok(result.triggered);
    assert.ok(result.alternatives.length >= 5);
    assert.ok(!result.alternatives.every((a) => /US warehouse/i.test(a.label)));
  });

  it("escalates owner authority without crossing spend gate", () => {
    const cycle = runExecutiveOperatingCycle({
      workspaceId: "test-exec-loop-auth",
      situation: ALL_CAPABILITY_SCENARIOS.F,
      mode: "sandbox",
      persist: false,
      recordFlight: false,
    });
    assert.equal(cycle.decision.authority, "requires_grand_king");
    assert.ok(cycle.escalation);
    assert.ok(cycle.escalation!.whatIFound);
    assert.ok(cycle.escalation!.whatINeedYouToDecide);
    assert.ok(cycle.escalation!.whatIWillDoNext);
  });

  it("persists objective across cycle for continuity probe", () => {
    const ws = `test-exec-continuity-${Date.now()}`;
    const cycle = runExecutiveOperatingCycle({
      workspaceId: ws,
      situation: ALL_CAPABILITY_SCENARIOS.G,
      mode: "sandbox",
      persist: true,
      recordFlight: false,
    });
    const latest = getLatestExecutiveCycle(ws);
    const objective = getCurrentObjective(ws);
    assert.equal(latest?.cycleId, cycle.cycleId);
    assert.equal(objective?.lastCycleId, cycle.cycleId);
    assert.ok(objective?.objective);
  });

  it("passes capability harness A–H in sandbox", () => {
    const ws = `test-cap-harness-${Date.now()}`;
    const result = runPillowCapabilityTests(ws);
    assert.equal(result.summary.total, 8);
    assert.equal(
      result.summary.failed,
      0,
      JSON.stringify(
        result.results.filter((r) => r.status === "FAIL"),
        null,
        2,
      ),
    );
    assert.equal(result.summary.passed, 8);
  });

  it("birth readiness does not declare Birth and keeps timestamp null path honest", () => {
    const report = evaluateExecutiveBirthReadiness("test-birth-readiness-empty");
    assert.equal(report.birthTimestamp, null);
    assert.equal(report.technicallyReadyForGrandKingAuthorisation, false);
    assert.ok(report.mandatoryStillOpen.length > 0);
    assert.ok(report.rows.some((r) => r.capability === "continuous executive loop"));
  });
});
