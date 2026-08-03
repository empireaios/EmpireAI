/** X3-04 — Bottleneck Detection Engine. */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityPlanningRecord } from "./types.js";

export class BottleneckDetectionEngine {
  detect(
    records: CapacityPlanningRecord[],
    config: CapacityPlanningEngineConfiguration,
  ): CapacityPlanningRecord[] {
    if (!config.bottleneckDetectionEnabled) return [];
    return records
      .filter((r) => r.capacityUtilization >= config.bottleneckDetectionThreshold)
      .map((r) => ({
        ...r,
        bottleneckSummary:
          r.capacityUtilization >= config.utilizationCriticalThreshold
            ? `Critical bottleneck · ${r.domain} at ${r.capacityUtilization}%`
            : `Bottleneck detected · ${r.domain} at ${r.capacityUtilization}%`,
        timestamp: new Date().toISOString(),
      }));
  }
}
