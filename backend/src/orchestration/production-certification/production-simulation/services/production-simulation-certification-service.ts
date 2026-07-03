/**
 * G6-09 — Production simulation certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  ProductionSimulationOverview,
  ProductionSimulationRunResult,
  ProductionSimulationType,
} from "../contracts/production-simulation-types.js";
import { PRODUCTION_SIMULATION_CERTIFICATION_VERSION } from "../contracts/production-simulation-types.js";
import { recordProductionSimulationEklsObservation } from "../ekls/production-simulation-ekls-integration.js";
import { validateProductionSimulationPillowGovernance } from "../governance/production-simulation-pillow-governance.js";
import { runProductionSimulationPluginValidators } from "../plugins/production-simulation-plugin-host.js";
import {
  listProductionSimulationDomains,
  resolveProductionSimulationScenarios,
} from "../registry/simulation-scenario-registry-resolver.js";
import { createSimulationCorrelationId, runEndToEndSimulation } from "./end-to-end-simulation-runner.js";
import { computeSimulationScore, deriveSimulationRunStatus } from "./simulation-score-engine.js";
import {
  analyseSimulationRisks,
  validateSimulationEvidence,
} from "../validation/production-simulation-validator.js";

let lastRun: ProductionSimulationRunResult | undefined;

export function getProductionSimulationOverview(context: RegistryLoaderContext = {}): ProductionSimulationOverview {
  const scenarios = resolveProductionSimulationScenarios(context);
  return {
    frameworkVersion: PRODUCTION_SIMULATION_CERTIFICATION_VERSION,
    scenarioCount: scenarios.length,
    simulationDomainCount: listProductionSimulationDomains(context).length,
    lastRunId: lastRun?.runId,
    lastStatus: lastRun?.status,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastProductionSimulationRun(): ProductionSimulationRunResult | undefined {
  return lastRun;
}

function executeSimulationRun(input: {
  context: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  simulationType?: ProductionSimulationType;
  scenarioId?: string;
  pillowGovernance: true;
}): ProductionSimulationRunResult {
  const context = input.context;
  const governance = validateProductionSimulationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: input.scenarioId ? "run_scenario" : "run_full",
    pillowGovernance: true,
  });

  const correlationId = createSimulationCorrelationId();
  const governanceState = governance.allowed ? "pillow-approved" : "pillow-blocked";

  if (!governance.allowed) {
    const blocked: ProductionSimulationRunResult = {
      runId: randomUUID(),
      correlationId,
      status: "blocked",
      simulationScore: 0,
      simulations: [],
      blockers: [{
        blockerId: "pillow-blocked",
        scenarioId: "pillow-governance",
        scenarioKind: "governance",
        simulationDomain: "production_simulation",
        severity: "critical",
        message: governance.reason,
      }],
      warnings: [],
      evidence: [],
      executiveRecommendations: ["Resolve Pillow governance rejection"],
      safeExecutionVerified: false,
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-SIMULATION",
    };
    lastRun = blocked;
    return blocked;
  }

  const scenarios = resolveProductionSimulationScenarios(context);
  const simulationType = input.simulationType ?? "dry_run";
  const simulations = runEndToEndSimulation({
    scenarios,
    context,
    simulationType,
    correlationId,
    governanceState,
    scenarioId: input.scenarioId,
  });

  const pluginFindings = runProductionSimulationPluginValidators({ workspaceId: input.workspaceId });
  const blockers = [
    ...simulations.flatMap((sim) => sim.blockers),
    ...pluginFindings.filter((f) => f.severity === "critical" || f.severity === "high"),
  ];
  const warnings = [
    ...simulations.flatMap((sim) => sim.blockers.filter((b) => b.severity !== "critical" && b.severity !== "high")),
    ...pluginFindings.filter((f) => f.severity !== "critical" && f.severity !== "high"),
  ];
  const { evidence, blockers: evidenceBlockers } = validateSimulationEvidence(simulations);
  blockers.push(...evidenceBlockers);

  const scenariosPassed = simulations.filter((s) => s.status === "pass" || s.status === "pass_with_conditions").length;
  const status = deriveSimulationRunStatus({ blockers, warnings, pillowBlocked: false });
  const simulationScore = computeSimulationScore({
    blockers,
    warnings,
    scenariosPassed,
    scenariosTotal: simulations.length,
  });
  const { executiveRecommendations } = analyseSimulationRisks({ blockers, warnings });
  const safeExecutionVerified = process.env.SIM_UNSAFE_LIVE_EXECUTION !== "true" && governance.safeExecutionBoundary;

  const runId = randomUUID();
  const result: ProductionSimulationRunResult = {
    runId,
    correlationId,
    status,
    simulationScore,
    simulations,
    blockers,
    warnings,
    evidence,
    executiveRecommendations,
    safeExecutionVerified,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-SIMULATION",
  };

  lastRun = result;

  const eklsBase = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId,
    pillowGovernance: true as const,
  };

  recordProductionSimulationEklsObservation({
    ...eklsBase,
    kind: "simulation_started",
    summary: `Production simulation started type=${simulationType}`,
  });

  recordProductionSimulationEklsObservation({
    ...eklsBase,
    kind: "simulation_completed",
    summary: `Production simulation ${status} score=${simulationScore}`,
    signalValue: simulationScore,
  });

  for (const blocker of blockers) {
    recordProductionSimulationEklsObservation({
      ...eklsBase,
      kind: status === "blocked" ? "simulation_blocked" : "simulation_failed",
      summary: blocker.message,
    });
  }

  if (evidence.length > 0) {
    recordProductionSimulationEklsObservation({
      ...eklsBase,
      kind: "simulation_evidence_recorded",
      summary: `Recorded ${evidence.length} simulation evidence entries`,
      signalValue: evidence.length,
    });
  }

  if (status === "pass" || status === "pass_with_conditions") {
    recordProductionSimulationEklsObservation({
      ...eklsBase,
      kind: "simulation_certified",
      summary: `Production simulation certified with status ${status}`,
      signalValue: simulationScore,
    });
  }

  return result;
}

export function runSimulationScenario(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  scenarioId: string;
  simulationType?: ProductionSimulationType;
  pillowGovernance: true;
}): ProductionSimulationRunResult {
  return executeSimulationRun({
    context: input.context ?? { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    scenarioId: input.scenarioId,
    simulationType: input.simulationType,
    pillowGovernance: true,
  });
}

export function runFullProductionSimulation(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  simulationType?: ProductionSimulationType;
  pillowGovernance: true;
}): ProductionSimulationRunResult {
  return executeSimulationRun({
    context: input.context ?? { workspaceId: input.workspaceId },
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    simulationType: input.simulationType,
    pillowGovernance: true,
  });
}

export function resetProductionSimulationStateForTests(): void {
  lastRun = undefined;
}
