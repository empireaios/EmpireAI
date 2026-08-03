import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AWO_CAPABILITIES,
  OPTIMIZATION_TARGETS,
  buildAdaptiveWorkforceOptimizerConfiguration,
  createAdaptiveWorkforceOptimizer,
  resetAdaptiveWorkforceOptimizerForTesting,
} from "../../adaptive-workforce-optimizer/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAdaptiveWorkforceOptimizer(bootstrap);
  await engine.initialize();
  engine.connectAdaptiveWorkforceOptimizer();
  return engine;
}

function sampleWorkers() {
  return [
    {
      workerId: "wcr-wkr-strategy-01",
      department: "strategy",
      utilizationPct: 92,
      queueDepth: 12,
      throughput: 40,
      accuracy: 88,
      reliability: 90,
      collaborationScore: 72,
      routingEfficiency: 55,
      operationalCost: 140,
      assignmentLoad: 94,
    },
    {
      workerId: "wcr-wkr-ops-02",
      department: "operations",
      utilizationPct: 28,
      queueDepth: 2,
      throughput: 22,
      accuracy: 81,
      reliability: 84,
      collaborationScore: 60,
      routingEfficiency: 78,
      operationalCost: 90,
      assignmentLoad: 30,
    },
    {
      workerId: "wcr-wkr-support-03",
      department: "operations",
      utilizationPct: 8,
      queueDepth: 0,
      throughput: 5,
      accuracy: 70,
      reliability: 68,
      collaborationScore: 50,
      routingEfficiency: 65,
      operationalCost: 70,
      assignmentLoad: 10,
    },
  ];
}

describe("Q0-17 Adaptive Workforce Optimizer", () => {
  beforeEach(resetAdaptiveWorkforceOptimizerForTesting);

  test("1 locks mandatory adaptive-workforce-optimizer boundaries", () => {
    const c = buildAdaptiveWorkforceOptimizerConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverModifyWorkersAutomatically: false as never,
      neverReplacePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverPerformStrategicPlanning: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverModifyWorkersAutomatically, true);
    assert.equal(c.neverReplacePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverPerformStrategicPlanning, true);
  });

  test("2 initializes PILLOW-AWO-001 for Q0-17", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-17");
    assert.equal(state.engineVersion, "PILLOW-AWO-001");
    for (const target of OPTIMIZATION_TARGETS) {
      assert.ok(state.configuration.optimizationTargets.includes(target));
    }
  });

  test("3 analyses workforce utilization and produces optimization records", async () => {
    const report = (await build()).analyseWorkerUtilization({
      workers: sampleWorkers(),
      validated: true,
    });
    const record = report.records[0]!;
    assert.ok(record.optimizationId.startsWith("awo-opt-"));
    assert.ok(record.currentPerformance.workerCount === 3);
    assert.ok(record.supportingEvidence.length >= 1);
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.metadataVersion, "AWO-001-v1");
  });

  test("4 detects bottlenecks across utilization, routing, and quality", async () => {
    const report = (await build()).detectBottlenecks({
      workers: sampleWorkers(),
      validated: true,
    });
    assert.ok(report.bottlenecks.length >= 1);
    assert.ok(report.records[0]!.bottlenecks.length >= 1);
  });

  test("5 detects overloaded workers", async () => {
    const report = (await build()).detectOverloadedWorkers({
      workers: sampleWorkers(),
      validated: true,
    });
    assert.ok(report.overloadedWorkers.includes("wcr-wkr-strategy-01"));
    assert.ok(report.records[0]!.overloadedWorkers.includes("wcr-wkr-strategy-01"));
  });

  test("6 detects underutilized and idle workers", async () => {
    const report = (await build()).detectUnderutilizedWorkers({
      workers: sampleWorkers(),
      validated: true,
    });
    assert.ok(report.underutilizedWorkers.includes("wcr-wkr-ops-02"));
    assert.ok(report.idleWorkers.includes("wcr-wkr-support-03"));
  });

  test("7 produces optimization recommendations without executing tasks", async () => {
    const report = (await build()).recommendImprovements({
      workers: sampleWorkers(),
      recommendationFocus: "all",
      validated: true,
    });
    assert.ok(report.recommendations.length >= 1);
    const record = report.records[0]!;
    assert.ok(record.recommendedChanges.length >= 1);
    assert.ok(record.expectedBenefits.length >= 1);
    assert.equal(record.neverExecuteWorkerTasks, true);
    assert.equal(record.workersModifiedAutomatically, false);
  });

  test("8 rejects execute / auto-modify / replace Pillow / Grand King / strategic-planning boundaries", async () => {
    const engine = await build();
    const base = { workers: sampleWorkers(), validated: true };
    assert.equal(
      engine.analyseWorkerUtilization({ ...base, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recommendImprovements({ ...base, modifyWorkersAutomatically: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.detectBottlenecks({ ...base, replacePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.detectOverloadedWorkers({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recommendImprovements({ ...base, performStrategicPlanning: true }).validation
        .decision,
      "fail",
    );
  });

  test("9 supports extensible optimization targets", async () => {
    const engine = createAdaptiveWorkforceOptimizer(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { optimizationTargets: [...OPTIMIZATION_TARGETS, "handoff_latency"] } },
    );
    await engine.initialize();
    engine.connectAdaptiveWorkforceOptimizer();
    assert.ok(engine.getState().configuration.optimizationTargets.includes("handoff_latency"));
    assert.ok(AWO_CAPABILITIES.includes("extensible_optimization_targets"));
  });

  test("10 validates stored optimization records", async () => {
    const engine = await build();
    engine.analyseWorkerUtilization({ workers: sampleWorkers(), validated: true });
    const validation = engine.validateAdaptiveWorkforceOptimizer({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
