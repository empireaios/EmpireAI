/** X3-11 — Demand Analysis Engine (demand / utilization monitors). */

import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type {
  ElasticityOperation,
  ElasticityRecord,
  OperationalElasticityInput,
} from "./types.js";
import {
  buildElasticityRecord,
  computeElasticitySignals,
} from "./structural-signals.js";

const OPERATION_FLAG: Partial<
  Record<ElasticityOperation, keyof OperationalElasticityEngineConfiguration>
> = {
  demand: "demandMonitoringEnabled",
  utilization: "utilizationMonitoringEnabled",
  workload_balance: "workloadBalancingEnabled",
  resource_optimization: "resourceOptimizationEnabled",
};

export class DemandAnalysisEngine {
  assess(
    operation: Extract<
      ElasticityOperation,
      "demand" | "utilization" | "workload_balance" | "resource_optimization"
    >,
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    sourceAvailable = true,
  ): ElasticityRecord {
    const flag = OPERATION_FLAG[operation];
    if (flag && !config[flag]) {
      throw new Error(`${operation} elasticity monitoring disabled`);
    }
    const signals = computeElasticitySignals(operation, input, config, sourceAvailable);
    return buildElasticityRecord({
      ...signals,
      config,
    });
  }
}
