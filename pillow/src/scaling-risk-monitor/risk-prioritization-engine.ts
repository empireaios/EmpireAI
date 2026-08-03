/** X3-13 — Risk Prioritization Engine. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { ScalingRiskRecord } from "./types.js";

const SEVERITY_RANK: Record<ScalingRiskRecord["riskSeverity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export class RiskPrioritizationEngine {
  rank(
    records: ScalingRiskRecord[],
    config: ScalingRiskMonitorConfiguration,
  ): ScalingRiskRecord[] {
    if (!config.riskRankingEnabled) {
      throw new Error("Risk ranking disabled");
    }
    // Never suppress critical scaling risks — critical always sorts first.
    return [...records].sort((a, b) => {
      const severityDelta = SEVERITY_RANK[b.riskSeverity] - SEVERITY_RANK[a.riskSeverity];
      if (severityDelta !== 0) return severityDelta;
      return b.riskProbability - a.riskProbability;
    });
  }
}
