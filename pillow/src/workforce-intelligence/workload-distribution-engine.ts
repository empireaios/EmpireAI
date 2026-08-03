/** X3-08 — Workload Distribution Engine. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceRecord } from "./types.js";
import {
  buildWorkforceRecord,
  computeWorkforceSignals,
} from "./structural-signals.js";

export class WorkloadDistributionEngine {
  assess(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecord {
    const signals = computeWorkforceSignals("distribution", input, config);
    const summary =
      signals.workloadDistribution < config.minWorkloadDistribution
        ? `Workload balance ${signals.workloadDistribution} below min ${config.minWorkloadDistribution} — redistribute tasks`
        : `Workload balance ${signals.workloadDistribution} · efficiency ${signals.workforceEfficiencyScore} within validated bounds`;
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
