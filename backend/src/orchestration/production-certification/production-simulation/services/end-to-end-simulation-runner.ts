/**
 * G6-09 — End-to-end production simulation runner.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { ProductionSimulationType } from "../contracts/production-simulation-types.js";
import type { ProductionSimulationScenario } from "../registry/simulation-scenario-registry-resolver.js";
import {
  runSimulationScenarioValidation,
  validateAutomationSimulation,
  validateCockpitSimulation,
  validateCommerceSimulation,
  validateFailureSimulation,
  validateIdentitySimulation,
  validateRecoverySimulation,
} from "../validation/production-simulation-validator.js";

export function runEndToEndSimulation(input: {
  scenarios: ProductionSimulationScenario[];
  context: RegistryLoaderContext;
  simulationType?: ProductionSimulationType;
  correlationId: string;
  governanceState: string;
  scenarioId?: string;
}) {
  const simulationType = input.simulationType ?? "dry_run";
  const { correlationId, governanceState, context } = input;

  if (input.scenarioId) {
    const scenario = input.scenarios.find((s) => s.scenarioId === input.scenarioId);
    if (!scenario) {
      return [];
    }
    return [runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState })];
  }

  const identity = validateIdentitySimulation(input.scenarios, context, simulationType, correlationId, governanceState);
  const cockpit = validateCockpitSimulation(input.scenarios, context, simulationType, correlationId, governanceState);
  const commerce = validateCommerceSimulation(input.scenarios, context, simulationType, correlationId, governanceState);
  const automation = validateAutomationSimulation(input.scenarios, context, simulationType, correlationId, governanceState);
  const recovery = validateRecoverySimulation(input.scenarios, context, simulationType, correlationId, governanceState);
  const failure = validateFailureSimulation(input.scenarios, context, simulationType, correlationId, governanceState);

  const covered = new Set([
    ...identity, ...cockpit, ...commerce, ...automation, ...recovery, ...failure,
  ].map((s) => s.scenarioId));

  const remaining = input.scenarios
    .filter((s) => !covered.has(s.scenarioId))
    .map((scenario) => runSimulationScenarioValidation({ scenario, context, simulationType, correlationId, governanceState }));

  return [...identity, ...cockpit, ...commerce, ...automation, ...recovery, ...failure, ...remaining];
}

export function createSimulationCorrelationId(): string {
  return randomUUID();
}
