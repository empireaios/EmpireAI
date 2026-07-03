/**
 * G6-09 — Production simulation scenario registry resolver.
 */

import type { CertificationRegistryRowBase } from "../../../../registry/types/certification-registry-types.js";
import { productionSimulationScenarioConfigurationSchema } from "../../../../registry/types/certification-registry-types.js";
import { REG_CERTIFICATION_SIMULATION } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export type ProductionSimulationScenario = ReturnType<typeof parseSimulationScenario>;

export function resolveProductionSimulationScenarios(
  context: RegistryLoaderContext = {},
): ProductionSimulationScenario[] {
  const rows = getRegistryLoader().resolve(context, REG_CERTIFICATION_SIMULATION)
    .rows as CertificationRegistryRowBase[];
  return rows.map(parseSimulationScenario);
}

export function resolveProductionSimulationScenario(
  context: RegistryLoaderContext,
  scenarioId: string,
): ProductionSimulationScenario | undefined {
  return resolveProductionSimulationScenarios(context).find((s) => s.scenarioId === scenarioId);
}

function parseSimulationScenario(row: CertificationRegistryRowBase) {
  const scenario = productionSimulationScenarioConfigurationSchema.parse(row.configuration.productionSimulationScenario);
  return { scenarioId: row.id, scenarioName: row.name, ...scenario };
}

export function listProductionSimulationDomains(context: RegistryLoaderContext = {}): string[] {
  return [...new Set(resolveProductionSimulationScenarios(context).map((s) => s.simulationDomain))];
}
