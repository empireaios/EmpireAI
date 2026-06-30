import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  COORDINATION_SIGNAL_TYPES,
  DEPENDENCY_TYPES,
  EXECUTION_NODE_STATUSES,
  MONITORING_STATUSES,
  RECOVERY_STRATEGIES,
  RETRY_POLICIES,
  SCHEDULE_STATUSES,
  createEngineCoordinationIntelligenceModule,
  createInMemoryEngineCoordinationIntelligenceRepository,
  generateEngineCoordination,
  validateEngineCoordinationReport,
} from "../../execution/engine-coordination-intelligence/index.js";

const WORKSPACE_ID = "ws-m099";

function buildCoordinationInput(workspaceId = WORKSPACE_ID) {
  return {
    workspaceId,
    reportName: "Empire Engine Coordination",
    coordinationIndex: 84,
  };
}

describe("Mission 099 Engine Coordination Intelligence Engine", () => {
  it("generates coordination report with safety flags", async () => {
    const module = createEngineCoordinationIntelligenceModule();
    const record = await module.persistCoordination(buildCoordinationInput());

    assert.ok(record.reportId);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoExecuteEnabled, false);
    assert.ok(record.totalEngines >= 1);
    assert.ok(record.signals.some((signal) => signal.signalType === "coordination_composite"));
  });

  it("schedules every engine with cron expressions", () => {
    const schedules = generateEngineCoordination(buildCoordinationInput()).schedules;

    assert.ok(schedules.length >= 5);
    for (const schedule of schedules) {
      assert.ok(SCHEDULE_STATUSES.includes(schedule.status));
      assert.ok(schedule.cronExpression.length > 0);
      assert.ok(schedule.nextRunAt.length > 0);
      assert.ok(schedule.priority >= 1);
    }
  });

  it("maps engine dependencies", () => {
    const dependencies = generateEngineCoordination(buildCoordinationInput()).dependencies;

    assert.ok(dependencies.length >= 1);
    for (const dependency of dependencies) {
      assert.ok(DEPENDENCY_TYPES.includes(dependency.dependencyType));
      assert.ok(dependency.sourceEngineName.length > 0);
      assert.ok(dependency.targetEngineName.length > 0);
    }
  });

  it("defines recovery plans for failed engines", () => {
    const recoveries = generateEngineCoordination(buildCoordinationInput()).recoveries;

    assert.ok(recoveries.length >= 1);
    for (const recovery of recoveries) {
      assert.ok(RECOVERY_STRATEGIES.includes(recovery.strategy));
      assert.ok(recovery.failureReason.length > 0);
      assert.ok(recovery.recoveryAction.length > 0);
    }
  });

  it("configures retry policies for all engines", () => {
    const retries = generateEngineCoordination(buildCoordinationInput()).retries;

    assert.ok(retries.length >= 5);
    for (const retry of retries) {
      assert.ok(RETRY_POLICIES.includes(retry.policy));
      assert.ok(retry.maxAttempts >= 0);
      assert.ok(retry.backoffSeconds >= 0);
    }
  });

  it("monitors engine health with heartbeats", () => {
    const monitoring = generateEngineCoordination(buildCoordinationInput()).monitoring;

    assert.ok(monitoring.length >= 5);
    for (const monitor of monitoring) {
      assert.ok(MONITORING_STATUSES.includes(monitor.status));
      assert.ok(monitor.lastHeartbeatAt.length > 0);
      assert.ok(monitor.successRatePercent >= 0 && monitor.successRatePercent <= 100);
      assert.ok(monitor.summary.length > 0);
    }
  });

  it("builds execution graph with nodes and edges", () => {
    const graph = generateEngineCoordination(buildCoordinationInput()).executionGraph;

    assert.ok(graph.nodes.length >= 5);
    assert.ok(graph.totalNodes === graph.nodes.length);
    for (const node of graph.nodes) {
      assert.ok(EXECUTION_NODE_STATUSES.includes(node.status));
      assert.ok(node.engineName.length > 0);
    }
    assert.ok(graph.edges.length >= 1);
    assert.ok(graph.summary.length > 0);
  });

  it("computes weighted confidence signals", () => {
    const report = generateEngineCoordination(buildCoordinationInput());

    assert.ok(report.signals.length >= 6);
    for (const signalType of COORDINATION_SIGNAL_TYPES) {
      assert.ok(report.signals.some((signal) => signal.signalType === signalType));
    }
    const composite = report.signals.find(
      (signal) => signal.signalType === "coordination_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates engine coordination report schema", () => {
    const report = generateEngineCoordination(buildCoordinationInput());
    const validated = validateEngineCoordinationReport({ reportId: randomUUID(), ...report });

    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoExecuteEnabled, false);
    assert.ok(validated.executionGraph.nodes.length >= 1);
    assert.equal(validated.totalEngines, validated.schedules.length);
  });

  it("persists coordination records in the repository", async () => {
    const repository = createInMemoryEngineCoordinationIntelligenceRepository();
    const module = createEngineCoordinationIntelligenceModule(repository);
    const input = buildCoordinationInput();

    const saved = await module.persistCoordination(input);
    const loadedByWorkspace = await module.getCoordinationByWorkspace(WORKSPACE_ID);
    const loadedById = await module.getCoordinationRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByWorkspace);
    assert.ok(loadedById);
    assert.equal(loadedByWorkspace!.totalEngines, saved.totalEngines);
    assert.equal(loadedById!.executionGraph.nodes.length, saved.executionGraph.nodes.length);

    const listed = await repository.list({ workspaceId: WORKSPACE_ID });
    assert.equal(listed.length, 1);
  });
});
