/** X3-18 — Capacity Simulation Engine (operational / supplier / workforce). */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class CapacitySimulationEngine {
  simulateOperationalCapacity(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.operationalCapacitySimulationEnabled) {
      throw new Error("Operational capacity simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "operational_capacity_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.capacityProjection >= config.capacityProjectionThreshold
        ? `Operational capacity projection ${signals.capacityProjection}% above ${config.capacityProjectionThreshold} — simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "capacity_constrained",
      recommendationSummary: summary,
    });
  }

  simulateSupplierCapacity(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.supplierCapacitySimulationEnabled) {
      throw new Error("Supplier capacity simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "supplier_capacity_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.capacityProjection >= config.capacityProjectionThreshold
        ? `Supplier capacity projection ${signals.capacityProjection}% above ${config.capacityProjectionThreshold} — simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "supplier_constrained",
      recommendationSummary: summary,
    });
  }

  simulateWorkforceUtilization(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.workforceUtilizationSimulationEnabled) {
      throw new Error("Workforce utilization simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "workforce_utilization_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.capacityProjection >= config.capacityProjectionThreshold
        ? `Workforce utilization projection ${signals.capacityProjection}% above ${config.capacityProjectionThreshold} — simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "workforce_constrained",
      recommendationSummary: summary,
    });
  }
}
