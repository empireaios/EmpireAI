/**
 * G6-09 — Cockpit Production Simulation backend contracts.
 */

import type {
  ProductionSimulationOverview,
  ProductionSimulationResultState,
  ProductionSimulationRunResult,
  SimulationBlocker,
  SimulationEvidence,
  ProductionSimulationResult,
} from "./production-simulation-types.js";

export const COCKPIT_PRODUCTION_SIMULATION_VIEW_ID = "cockpit-production-simulation" as const;

export type CockpitProductionSimulationView = {
  viewId: typeof COCKPIT_PRODUCTION_SIMULATION_VIEW_ID;
  computedAt: string;
  dataMode: "simulation";
  productionSimulationOverview: ProductionSimulationOverview;
  simulationScenarios: Array<Pick<ProductionSimulationResult, "scenarioId" | "scope" | "simulationType" | "status">>;
  simulationStatus: ProductionSimulationResultState;
  simulationEvidence: SimulationEvidence[];
  simulationBlockers: SimulationBlocker[];
  simulationRecommendations: string[];
  certificationStatus: ProductionSimulationResultState;
  simulationScore: number;
  safeExecutionVerified: boolean;
  lastRun?: Pick<ProductionSimulationRunResult, "runId" | "status" | "simulationScore" | "scannedAt">;
  discoverySource: "production-certification:production-simulation-cockpit";
};

export function buildCockpitProductionSimulationView(input: {
  overview: ProductionSimulationOverview;
  run?: ProductionSimulationRunResult;
}): CockpitProductionSimulationView {
  const run = input.run;
  return {
    viewId: COCKPIT_PRODUCTION_SIMULATION_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "simulation",
    productionSimulationOverview: input.overview,
    simulationScenarios: (run?.simulations ?? []).map((sim) => ({
      scenarioId: sim.scenarioId,
      scope: sim.scope,
      simulationType: sim.simulationType,
      status: sim.status,
    })),
    simulationStatus: run?.status ?? "unknown",
    simulationEvidence: run?.evidence ?? [],
    simulationBlockers: run?.blockers ?? [],
    simulationRecommendations: run?.executiveRecommendations ?? [],
    certificationStatus: run?.status ?? "warning",
    simulationScore: run?.simulationScore ?? 0,
    safeExecutionVerified: run?.safeExecutionVerified ?? false,
    lastRun: run
      ? { runId: run.runId, status: run.status, simulationScore: run.simulationScore, scannedAt: run.scannedAt }
      : undefined,
    discoverySource: "production-certification:production-simulation-cockpit",
  };
}
