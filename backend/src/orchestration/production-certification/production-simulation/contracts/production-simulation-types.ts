/**
 * G6-09 — Production simulation certification contract types.
 */

import { z } from "zod";
import type {
  ProductionSimulationResultState,
  ProductionSimulationType,
} from "../../../../registry/types/certification-registry-types.js";
import {
  PRODUCTION_SIMULATION_RESULT_STATES,
  PRODUCTION_SIMULATION_TYPES,
} from "../../../../registry/types/certification-registry-types.js";

export const PRODUCTION_SIMULATION_CERTIFICATION_VERSION = "g6-09-v1" as const;

export { PRODUCTION_SIMULATION_RESULT_STATES, PRODUCTION_SIMULATION_TYPES };
export type { ProductionSimulationResultState, ProductionSimulationType };

export const PRODUCTION_SIMULATION_EKLS_KINDS = [
  "simulation_started",
  "simulation_completed",
  "simulation_failed",
  "simulation_blocked",
  "simulation_evidence_recorded",
  "simulation_certified",
] as const;

export type ProductionSimulationEklsKind = (typeof PRODUCTION_SIMULATION_EKLS_KINDS)[number];

export type SimulationStep = {
  stepId: string;
  stepRef: string;
  status: ProductionSimulationResultState;
  summary: string;
};

export type SimulationEvidence = {
  evidenceId: string;
  kind: "step" | "signal" | "sandbox" | "mock" | "redacted";
  summary: string;
  ref?: string;
};

export type SimulationBlocker = {
  blockerId: string;
  scenarioId: string;
  scenarioKind: string;
  simulationDomain: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type SimulationRisk = {
  riskId: string;
  scenarioId: string;
  simulationDomain: string;
  severity: SimulationBlocker["severity"];
  summary: string;
  mitigation?: string;
};

/** G6-09 — Every simulation result conforms to this contract. */
export type ProductionSimulationResult = {
  simulationId: string;
  scenarioId: string;
  scope: string;
  simulationType: ProductionSimulationType;
  status: ProductionSimulationResultState;
  steps: SimulationStep[];
  evidence: SimulationEvidence[];
  blockers: SimulationBlocker[];
  risks: SimulationRisk[];
  recommendations: string[];
  startedAt: string;
  completedAt: string;
  correlationId: string;
  governanceState: string;
};

export type ProductionSimulationRunResult = {
  runId: string;
  correlationId: string;
  status: ProductionSimulationResultState;
  simulationScore: number;
  simulations: ProductionSimulationResult[];
  blockers: SimulationBlocker[];
  warnings: SimulationBlocker[];
  evidence: SimulationEvidence[];
  executiveRecommendations: string[];
  safeExecutionVerified: boolean;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-SIMULATION";
};

export type ProductionSimulationOverview = {
  frameworkVersion: typeof PRODUCTION_SIMULATION_CERTIFICATION_VERSION;
  scenarioCount: number;
  simulationDomainCount: number;
  lastRunId?: string;
  lastStatus?: ProductionSimulationResultState;
  generatedAt: string;
};

export const productionSimulationPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["scenario", "validator", "mock_provider", "sandbox_provider", "evidence_collector"]),
  pillowGovernance: z.literal(true),
});

export type ProductionSimulationPluginManifest = z.infer<typeof productionSimulationPluginManifestSchema>;

export const SAFE_SIMULATION_TYPES: readonly ProductionSimulationType[] = [
  "dry_run",
  "sandbox",
  "mocked",
  "replay",
  "synthetic",
  "safe_live_check",
  "future_simulation_type",
];

export function isSimulationTypeSafe(type: ProductionSimulationType): boolean {
  return (SAFE_SIMULATION_TYPES as readonly string[]).includes(type);
}
