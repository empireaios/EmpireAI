/** X3-08 — Workforce Capacity Engine. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceRecord } from "./types.js";
import {
  buildWorkforceRecord,
  computeWorkforceSignals,
} from "./structural-signals.js";

export class WorkforceCapacityEngine {
  assess(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecord {
    const signals = computeWorkforceSignals("capacity", input, config);
    const summary =
      signals.agentUtilization < config.minAgentUtilization
        ? `Capacity utilization ${signals.agentUtilization} below min ${config.minAgentUtilization} — hold workforce expansion`
        : signals.agentUtilization > 95
          ? `Capacity utilization ${signals.agentUtilization} near overload — do not overload beyond validated limits`
          : `Capacity utilization ${signals.agentUtilization} within validated threshold — monitor headroom`;
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
