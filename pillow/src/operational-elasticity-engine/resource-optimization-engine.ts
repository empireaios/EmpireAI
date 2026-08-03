/** X3-11 — Resource Optimization Engine. */

import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type { ElasticityRecord } from "./types.js";

export class ResourceOptimizationEngine {
  optimize(
    records: ElasticityRecord[],
    config: OperationalElasticityEngineConfiguration,
  ): ElasticityRecord[] {
    if (!config.resourceOptimizationEnabled) return [];

    const optimized = [...records]
      .sort((a, b) => {
        const gapA = Math.abs(a.currentUtilization - a.targetUtilization);
        const gapB = Math.abs(b.currentUtilization - b.targetUtilization);
        return gapB - gapA;
      })
      .map((r, index) => ({
        ...r,
        resourceAllocationSummary: `Resource optimization rank #${index + 1} · ${r.operationalComponent} · util ${r.currentUtilization}% · target ${r.targetUtilization}% · adj ${r.scalingAdjustment}`,
        timestamp: new Date().toISOString(),
      }));

    return optimized;
  }
}
