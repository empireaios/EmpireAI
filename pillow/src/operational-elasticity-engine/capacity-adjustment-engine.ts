/** X3-11 — Capacity Adjustment Engine (scale up / down / capacity detection). */

import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type { ElasticityRecord, OperationalElasticityInput } from "./types.js";
import {
  buildElasticityRecord,
  computeElasticitySignals,
} from "./structural-signals.js";

export class CapacityAdjustmentEngine {
  scaleUp(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    sourceAvailable = true,
  ): ElasticityRecord {
    if (!config.capacityScaleUpEnabled) {
      throw new Error("Capacity scale-up disabled");
    }
    const signals = computeElasticitySignals("scale_up", input, config, sourceAvailable);
    return buildElasticityRecord({
      ...signals,
      config,
    });
  }

  scaleDown(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    sourceAvailable = true,
  ): ElasticityRecord {
    if (!config.capacityScaleDownEnabled) {
      throw new Error("Capacity scale-down disabled");
    }
    const signals = computeElasticitySignals("scale_down", input, config, sourceAvailable);
    return buildElasticityRecord({
      ...signals,
      config,
    });
  }

  detectOvercapacity(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    sourceAvailable = true,
  ): ElasticityRecord {
    if (!config.overcapacityDetectionEnabled) {
      throw new Error("Overcapacity detection disabled");
    }
    const signals = computeElasticitySignals("overcapacity", input, config, sourceAvailable);
    const util = signals.currentUtilization;
    const summary =
      util >= config.overcapacityThreshold
        ? `Overcapacity detected at ${util}% (threshold ${config.overcapacityThreshold}) — contract within validated limits`
        : `Utilization ${util}% within overcapacity bounds — ${signals.resourceAllocationSummary}`;
    return buildElasticityRecord({
      ...signals,
      resourceAllocationSummary: summary,
      config,
    });
  }

  detectUndercapacity(
    input: OperationalElasticityInput,
    config: OperationalElasticityEngineConfiguration,
    sourceAvailable = true,
  ): ElasticityRecord {
    if (!config.undercapacityDetectionEnabled) {
      throw new Error("Undercapacity detection disabled");
    }
    const signals = computeElasticitySignals("undercapacity", input, config, sourceAvailable);
    const util = signals.currentUtilization;
    const summary =
      util <= config.undercapacityThreshold
        ? `Undercapacity detected at ${util}% (threshold ${config.undercapacityThreshold}) — expand within validated limits`
        : `Utilization ${util}% above undercapacity floor — ${signals.resourceAllocationSummary}`;
    return buildElasticityRecord({
      ...signals,
      resourceAllocationSummary: summary,
      config,
    });
  }
}
