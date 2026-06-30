import { randomUUID } from "node:crypto";

import type { CoordinationSignal, CoordinationSignalType } from "../models/coordination-signal.js";
import type { EngineCoordinationReportCreateInput } from "../models/engine-coordination-report.js";
import type { EngineDependency } from "../models/engine-dependency.js";
import type { EngineMonitoring } from "../models/engine-monitoring.js";
import type { EngineRecovery } from "../models/engine-recovery.js";
import type { EngineRetry } from "../models/engine-retry.js";
import type { EngineSchedule } from "../models/engine-schedule.js";
import type { ExecutionGraph } from "../models/execution-graph.js";

export const COORDINATION_SIGNAL_WEIGHTS: Record<CoordinationSignalType, number> = {
  scheduling_health: 0.16,
  dependency_satisfaction: 0.18,
  recovery_readiness: 0.14,
  retry_coverage: 0.14,
  monitoring_status: 0.16,
  graph_progress: 0.2,
  coordination_composite: 0.02,
};

export type EngineCoordinationEngineDef = {
  engineId: string;
  engineName: string;
  cronExpression?: string;
  dependsOn?: string[];
};

export type EngineCoordinationInput = {
  workspaceId: string;
  reportName?: string;
  engines?: EngineCoordinationEngineDef[];
  coordinationIndex?: number;
};

export type EngineCoordinationBreakdown = EngineCoordinationReportCreateInput;

export const DEFAULT_ENGINES: EngineCoordinationEngineDef[] = [
  { engineId: "eye-intelligence", engineName: "Eye Intelligence", cronExpression: "0 */6 * * *" },
  {
    engineId: "product-intelligence",
    engineName: "Product Intelligence",
    cronExpression: "0 */4 * * *",
    dependsOn: ["eye-intelligence"],
  },
  {
    engineId: "brand-genesis",
    engineName: "Brand Genesis",
    cronExpression: "0 8 * * *",
    dependsOn: ["product-intelligence"],
  },
  {
    engineId: "marketing-campaign-genesis",
    engineName: "Marketing Campaign Genesis",
    cronExpression: "0 9 * * *",
    dependsOn: ["brand-genesis"],
  },
  {
    engineId: "inventory-intelligence",
    engineName: "Inventory Intelligence",
    cronExpression: "0 */2 * * *",
    dependsOn: ["product-intelligence"],
  },
  {
    engineId: "financial-forecast-intelligence",
    engineName: "Financial Forecast Intelligence",
    cronExpression: "0 7 * * *",
    dependsOn: ["marketing-campaign-genesis", "inventory-intelligence"],
  },
  {
    engineId: "empire-health-intelligence",
    engineName: "Empire Health Intelligence",
    cronExpression: "0 * * * *",
    dependsOn: ["financial-forecast-intelligence"],
  },
  {
    engineId: "risk-detection-intelligence",
    engineName: "Risk Detection Intelligence",
    cronExpression: "*/30 * * * *",
    dependsOn: ["empire-health-intelligence"],
  },
];

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: CoordinationSignalType,
  score: number,
  detail: string,
): CoordinationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: COORDINATION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: EngineCoordinationInput): number {
  const coordinationBoost = input.coordinationIndex
    ? Math.min(10, input.coordinationIndex / 10)
    : 5;
  return clampScore(coordinationBoost + 72);
}

function addMinutesIso(minutes: number): string {
  const date = new Date();
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function addHoursIso(hours: number): string {
  const date = new Date();
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

function buildSchedules(engines: EngineCoordinationEngineDef[]): EngineSchedule[] {
  const score = baseScore({ workspaceId: "temp" });

  return engines.map((engine, index) => ({
    scheduleId: randomUUID(),
    engineId: engine.engineId,
    engineName: engine.engineName,
    cronExpression: engine.cronExpression ?? "0 * * * *",
    nextRunAt: addMinutesIso(15 + index * 10),
    lastRunAt: index % 3 === 0 ? addHoursIso(-2) : addHoursIso(-1),
    status: (index === engines.length - 1 && engines.length > 6 ? "RUNNING" : "SCHEDULED") as EngineSchedule["status"],
    priority: index + 1,
    score: clampScore(score - index),
  }));
}

function buildDependencies(engines: EngineCoordinationEngineDef[]): EngineDependency[] {
  const score = baseScore({ workspaceId: "temp" });
  const engineMap = new Map(engines.map((engine) => [engine.engineId, engine]));
  const dependencies: EngineDependency[] = [];

  for (const engine of engines) {
    for (const depId of engine.dependsOn ?? []) {
      const dep = engineMap.get(depId);
      if (!dep) continue;
      dependencies.push({
        dependencyId: randomUUID(),
        sourceEngineId: dep.engineId,
        targetEngineId: engine.engineId,
        sourceEngineName: dep.engineName,
        targetEngineName: engine.engineName,
        dependencyType: "REQUIRES",
        satisfied: true,
        score: clampScore(score),
      });
    }
  }

  if (dependencies.length === 0 && engines.length >= 2) {
    dependencies.push({
      dependencyId: randomUUID(),
      sourceEngineId: engines[0]!.engineId,
      targetEngineId: engines[1]!.engineId,
      sourceEngineName: engines[0]!.engineName,
      targetEngineName: engines[1]!.engineName,
      dependencyType: "REQUIRES",
      satisfied: true,
      score: clampScore(score),
    });
  }

  return dependencies;
}

function buildRecoveries(engines: EngineCoordinationEngineDef[]): EngineRecovery[] {
  const failedEngine = engines[engines.length - 1];
  if (!failedEngine) return [];

  return [
    {
      recoveryId: randomUUID(),
      engineId: failedEngine.engineId,
      engineName: failedEngine.engineName,
      failureReason: "Upstream dependency timeout exceeded 30s threshold.",
      strategy: "RESTART",
      recoveryAction: "Restart engine with cleared state and re-run dependency check.",
      estimatedRecoveryMinutes: 5,
      score: 78,
    },
  ];
}

function buildRetries(engines: EngineCoordinationEngineDef[]): EngineRetry[] {
  return engines.map((engine, index) => ({
    retryId: randomUUID(),
    engineId: engine.engineId,
    engineName: engine.engineName,
    policy: "EXPONENTIAL_BACKOFF" as const,
    maxAttempts: 3,
    currentAttempt: index === engines.length - 1 ? 1 : 0,
    nextRetryAt: index === engines.length - 1 ? addMinutesIso(5) : null,
    backoffSeconds: 30,
    score: clampScore(85 - index),
  }));
}

function buildMonitoring(engines: EngineCoordinationEngineDef[]): EngineMonitoring[] {
  const now = new Date().toISOString();

  return engines.map((engine, index) => {
    const isLast = index === engines.length - 1;
    const status: EngineMonitoring["status"] = isLast && engines.length > 6 ? "DEGRADED" : "HEALTHY";

    return {
      monitorId: randomUUID(),
      engineId: engine.engineId,
      engineName: engine.engineName,
      status,
      lastHeartbeatAt: now,
      averageDurationMs: 1200 + index * 300,
      successRatePercent: isLast && engines.length > 6 ? 88 : clampScore(96 - index),
      activeExecutions: isLast && engines.length > 6 ? 1 : 0,
      score: clampScore(status === "HEALTHY" ? 90 - index : 70),
      summary: `${engine.engineName} ${status.toLowerCase()} — heartbeat ${now.slice(11, 19)} UTC`,
    };
  });
}

function buildExecutionGraph(
  engines: EngineCoordinationEngineDef[],
  dependencies: EngineDependency[],
): ExecutionGraph {
  const score = baseScore({ workspaceId: "temp" });
  const nodes = engines.map((engine, index) => {
    const isLast = index === engines.length - 1;
    let status: ExecutionGraph["nodes"][0]["status"] = index === 0 ? "COMPLETED" : "PENDING";
    if (index > 0 && index < engines.length - 1) status = "COMPLETED";
    if (isLast && engines.length > 6) status = "FAILED";
    if (isLast && engines.length <= 6) status = "RUNNING";

    return {
      nodeId: randomUUID(),
      engineId: engine.engineId,
      engineName: engine.engineName,
      status,
      order: index,
      durationMs: status === "COMPLETED" ? 800 + index * 200 : status === "RUNNING" ? null : null,
      score: clampScore(score - index),
    };
  });

  const nodeIdByEngine = new Map(nodes.map((node) => [node.engineId, node.nodeId]));
  const edges = dependencies
    .map((dependency) => {
      const sourceNodeId = nodeIdByEngine.get(dependency.sourceEngineId);
      const targetNodeId = nodeIdByEngine.get(dependency.targetEngineId);
      if (!sourceNodeId || !targetNodeId) return null;
      return {
        edgeId: randomUUID(),
        sourceNodeId,
        targetNodeId,
        label: dependency.dependencyType,
      };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  const completedNodes = nodes.filter((node) => node.status === "COMPLETED").length;
  const failedNodes = nodes.filter((node) => node.status === "FAILED").length;

  return {
    graphId: randomUUID(),
    graphName: "Empire Engine Execution Graph",
    nodes,
    edges,
    totalNodes: nodes.length,
    completedNodes,
    failedNodes,
    score: clampScore(score - failedNodes * 10),
    summary: `Execution graph — ${completedNodes}/${nodes.length} completed, ${failedNodes} failed.`,
  };
}

function buildSignals(
  schedules: EngineSchedule[],
  dependencies: EngineDependency[],
  recoveries: EngineRecovery[],
  retries: EngineRetry[],
  monitoring: EngineMonitoring[],
  graph: ExecutionGraph,
  confidence: number,
): CoordinationSignal[] {
  const satisfiedDeps = dependencies.filter((dep) => dep.satisfied).length;

  return [
    buildSignal(
      "scheduling_health",
      average(schedules.map((schedule) => schedule.score)),
      `${schedules.length} engines scheduled`,
    ),
    buildSignal(
      "dependency_satisfaction",
      dependencies.length > 0
        ? clampScore((satisfiedDeps / dependencies.length) * 100)
        : 100,
      `${satisfiedDeps}/${dependencies.length} dependencies satisfied`,
    ),
    buildSignal(
      "recovery_readiness",
      recoveries.length > 0 ? average(recoveries.map((recovery) => recovery.score)) : 90,
      `${recoveries.length} recovery plans defined`,
    ),
    buildSignal(
      "retry_coverage",
      average(retries.map((retry) => retry.score)),
      `${retries.length} engines with retry policies`,
    ),
    buildSignal(
      "monitoring_status",
      average(monitoring.map((monitor) => monitor.score)),
      `${monitoring.filter((monitor) => monitor.status === "HEALTHY").length}/${monitoring.length} engines healthy`,
    ),
    buildSignal(
      "graph_progress",
      graph.score,
      graph.summary,
    ),
    buildSignal("coordination_composite", confidence, `Engine coordination confidence ${confidence}`),
  ];
}

function computeConfidence(signals: CoordinationSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "coordination_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "coordination_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  schedules: EngineSchedule[],
  monitoring: EngineMonitoring[],
  graph: ExecutionGraph,
): number {
  const degradedPenalty = monitoring.filter((monitor) => monitor.status !== "HEALTHY").length * 5;
  const failedPenalty = graph.failedNodes * 8;
  return clampScore(average([average(schedules.map((s) => s.score)), graph.score]) - degradedPenalty - failedPenalty);
}

/** Generates engine coordination report — intelligence only, no auto-execute. */
export function generateEngineCoordination(
  input: EngineCoordinationInput,
): EngineCoordinationBreakdown {
  const engines = input.engines ?? DEFAULT_ENGINES;
  const schedules = buildSchedules(engines);
  const dependencies = buildDependencies(engines);
  const recoveries = buildRecoveries(engines);
  const retries = buildRetries(engines);
  const monitoring = buildMonitoring(engines);
  const executionGraph = buildExecutionGraph(engines, dependencies);

  const provisionalSignals = buildSignals(
    schedules,
    dependencies,
    recoveries,
    retries,
    monitoring,
    executionGraph,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    schedules,
    dependencies,
    recoveries,
    retries,
    monitoring,
    executionGraph,
    confidence,
  );
  const overallScore = computeOverallScore(schedules, monitoring, executionGraph);

  return {
    workspaceId: input.workspaceId,
    reportName: input.reportName ?? "Empire Engine Coordination",
    schedules,
    dependencies,
    recoveries,
    retries,
    monitoring,
    executionGraph,
    totalEngines: engines.length,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoExecuteEnabled: false,
  };
}

export const engineCoordinationIntelligenceScoring = {
  generateEngineCoordination,
  computeConfidence,
  computeOverallScore,
  COORDINATION_SIGNAL_WEIGHTS,
  DEFAULT_ENGINES,
};
