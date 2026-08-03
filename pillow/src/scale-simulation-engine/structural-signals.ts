/** X3-18 — Shared structural scale simulation helpers. */

import { SSI_METADATA_VERSION } from "./paths.js";
import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type {
  SimulationOperation,
  ScaleSimulationRecord,
  ScaleSimulationInput,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function defaultCompany(input?: ScaleSimulationInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultScenario(
  operation: SimulationOperation,
  input?: ScaleSimulationInput,
): string {
  if (input?.simulationScenarioHint) return String(input.simulationScenarioHint);
  switch (operation) {
    case "revenue_outcome_simulation":
      return "revenue_focus";
    case "profit_outcome_simulation":
      return "profit_focus";
    case "operational_capacity_simulation":
      return "capacity_constrained";
    case "supplier_capacity_simulation":
      return "supplier_constrained";
    case "workforce_utilization_simulation":
      return "workforce_constrained";
    case "financial_impact_simulation":
      return "balanced";
    case "scaling_risk_simulation":
      return "risk_averse";
    case "multi_scenario_comparison":
    case "simulation_outcome_ranking":
      return "balanced";
    case "scaling_scenario_simulation":
    default:
      return "baseline_scale";
  }
}

export function buildScaleSimulationRecord(input: {
  companyReference: string;
  simulationScenario: string;
  revenueProjection: number;
  profitProjection: number;
  capacityProjection: number;
  riskProjection: number;
  overallSimulationScore: number;
  recommendationSummary: string;
}): ScaleSimulationRecord {
  return {
    simulationId: `ssi-sim-${Date.now()}-${input.simulationScenario.slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    simulationScenario: input.simulationScenario,
    revenueProjection: clampScore(input.revenueProjection),
    profitProjection: clampScore(input.profitProjection),
    capacityProjection: clampScore(input.capacityProjection),
    riskProjection: clampScore(input.riskProjection),
    overallSimulationScore: clampScore(input.overallSimulationScore),
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: SSI_METADATA_VERSION,
    neverExecuteSimulatedActionsAgainstProduction: true,
    structuralSignalOnly: true,
    simulationOnly: true,
    sensitiveOperationalData: false,
    sensitiveFinancialData: false,
  };
}

export function computeScaleSimulationSignals(
  operation: SimulationOperation,
  input: ScaleSimulationInput,
  config: ScaleSimulationEngineConfiguration,
  sourceAvailable = true,
): {
  companyReference: string;
  simulationScenario: string;
  revenueProjection: number;
  profitProjection: number;
  capacityProjection: number;
  riskProjection: number;
  overallSimulationScore: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const simulationScenario = defaultScenario(operation, input);
  const seed = `${company}::${simulationScenario}::${operation}`;

  const overallSimulationScore = clampScore(
    input.overallSimulationScoreHint ?? hashScore(`${seed}:overall`, 20, 95),
  );
  const revenueProjection = clampScore(
    input.revenueProjectionHint ?? hashScore(`${seed}:revenue`, 25, 90),
  );
  const profitProjection = clampScore(
    input.profitProjectionHint ?? hashScore(`${seed}:profit`, 20, 85),
  );
  const capacityProjection = clampScore(
    input.capacityProjectionHint ?? hashScore(`${seed}:capacity`, 22, 88),
  );
  const riskProjection = clampScore(
    input.riskProjectionHint ?? hashScore(`${seed}:risk`, 15, 80),
  );

  let recommendationSummary =
    "Scale simulation within structural bounds — simulation only; never execute simulated actions against production";

  const operationThreshold = ((): number => {
    switch (operation) {
      case "revenue_outcome_simulation":
        return config.revenueProjectionThreshold;
      case "profit_outcome_simulation":
        return config.profitProjectionThreshold;
      case "operational_capacity_simulation":
      case "supplier_capacity_simulation":
      case "workforce_utilization_simulation":
        return config.capacityProjectionThreshold;
      case "financial_impact_simulation":
      case "scaling_risk_simulation":
        return config.riskProjectionThreshold;
      case "multi_scenario_comparison":
      case "simulation_outcome_ranking":
      case "scaling_scenario_simulation":
      default:
        return config.simulationScoreThreshold;
    }
  })();

  if (!sourceAvailable) {
    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; simulation only; never execute simulated actions against production`;
  } else if (overallSimulationScore >= operationThreshold) {
    recommendationSummary = `${operation} score ${overallSimulationScore}% supports cautious simulated scale on ${company} · ${simulationScenario}`;
  } else {
    recommendationSummary = `Hold simulated scale for ${simulationScenario} — score ${overallSimulationScore}% below threshold; never execute simulated actions against production`;
  }

  if (
    config.neverExecuteSimulatedActionsAgainstProduction &&
    overallSimulationScore < config.simulationScoreThreshold
  ) {
    recommendationSummary = `${recommendationSummary} · never execute simulated actions against production`;
  }

  return {
    companyReference: company,
    simulationScenario,
    revenueProjection,
    profitProjection,
    capacityProjection,
    riskProjection,
    overallSimulationScore,
    recommendationSummary,
  };
}
