/** X3-08 — Agent Utilization Engine. */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceRecord } from "./types.js";
import {
  buildWorkforceRecord,
  computeWorkforceSignals,
} from "./structural-signals.js";

export class AgentUtilizationEngine {
  assess(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecord {
    const signals = computeWorkforceSignals("utilization", input, config);
    let summary = signals.recommendationSummary;
    if (signals.agentUtilization > 95) {
      summary = `Agent utilization ${signals.agentUtilization} exceeds validated overload ceiling — do not overload`;
    } else if (signals.agentUtilization < config.minAgentUtilization) {
      summary = `Agent utilization ${signals.agentUtilization} below min ${config.minAgentUtilization} — rebalance agents`;
    } else if (signals.throughputMetrics < config.minThroughputMetrics) {
      summary = `Throughput ${signals.throughputMetrics} below min ${config.minThroughputMetrics} — stabilize execution first`;
    } else {
      summary = `Utilization ${signals.agentUtilization} · throughput ${signals.throughputMetrics} within validated analytics bounds`;
    }
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
