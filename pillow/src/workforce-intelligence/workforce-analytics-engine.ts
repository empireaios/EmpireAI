/** X3-08 — Workforce Analytics Engine (throughput + task completion + efficiency + bottlenecks). */

import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceRecord } from "./types.js";
import {
  buildWorkforceRecord,
  computeWorkforceSignals,
} from "./structural-signals.js";

export class WorkforceAnalyticsEngine {
  assess(
    input: WorkforceIntelligenceInput,
    config: WorkforceIntelligenceConfiguration,
    focus: "throughput" | "task_completion" | "efficiency" = "efficiency",
  ): WorkforceRecord {
    const signals = computeWorkforceSignals(focus, input, config);
    let summary: string;
    if (focus === "throughput") {
      summary = `Execution throughput ${signals.throughputMetrics} · ${signals.recommendationSummary}`;
    } else if (focus === "task_completion") {
      summary = `Task-completion structural score · efficiency ${signals.workforceEfficiencyScore} — ${signals.recommendationSummary}`;
    } else {
      summary = `Workforce efficiency ${signals.workforceEfficiencyScore} · ${signals.recommendationSummary}`;
    }
    return buildWorkforceRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }

  detectBottlenecks(
    records: WorkforceRecord[],
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecord[] {
    if (!config.bottleneckDetectionEnabled) return [];
    return records
      .filter(
        (r) =>
          r.agentUtilization < config.bottleneckThreshold ||
          r.workloadDistribution < config.bottleneckThreshold ||
          r.throughputMetrics < config.bottleneckThreshold ||
          r.workforceEfficiencyScore < config.bottleneckThreshold ||
          r.agentUtilization < config.minAgentUtilization ||
          r.throughputMetrics < config.minThroughputMetrics ||
          r.workforceEfficiencyScore < config.minWorkforceEfficiencyScore ||
          r.agentUtilization > 95,
      )
      .map((r) => {
        let recommendationSummary = r.recommendationSummary;
        if (r.agentUtilization > 95) {
          recommendationSummary = `Critical overload bottleneck · ${r.workforceReference} at utilization ${r.agentUtilization}`;
        } else if (r.agentUtilization < config.bottleneckThreshold) {
          recommendationSummary = `Critical utilization bottleneck · ${r.workforceReference} at utilization ${r.agentUtilization}`;
        } else if (r.throughputMetrics < config.bottleneckThreshold) {
          recommendationSummary = `Critical throughput bottleneck · ${r.workforceReference} at throughput ${r.throughputMetrics}`;
        } else if (r.workloadDistribution < config.bottleneckThreshold) {
          recommendationSummary = `Workload distribution bottleneck · ${r.workforceReference} at ${r.workloadDistribution}`;
        } else if (r.workforceEfficiencyScore < config.bottleneckThreshold) {
          recommendationSummary = `Efficiency bottleneck · ${r.workforceReference} at ${r.workforceEfficiencyScore}`;
        } else if (r.agentUtilization < config.minAgentUtilization) {
          recommendationSummary = `Utilization below min · ${r.workforceReference} at ${r.agentUtilization}`;
        } else if (r.throughputMetrics < config.minThroughputMetrics) {
          recommendationSummary = `Throughput below min · ${r.workforceReference} at ${r.throughputMetrics}`;
        } else {
          recommendationSummary = `Workforce efficiency readiness bottleneck · ${r.workforceReference} at ${r.workforceEfficiencyScore}`;
        }
        return {
          ...r,
          recommendationSummary,
          timestamp: new Date().toISOString(),
        };
      });
  }

  detectUnderutilized(
    records: WorkforceRecord[],
    config: WorkforceIntelligenceConfiguration,
  ): WorkforceRecord[] {
    if (!config.underutilizedDetectionEnabled) return [];
    return records
      .filter((r) => r.agentUtilization < config.underutilizedThreshold)
      .map((r) => ({
        ...r,
        recommendationSummary: `Underutilized agent signal · ${r.workforceReference} at utilization ${r.agentUtilization} (threshold ${config.underutilizedThreshold})`,
        timestamp: new Date().toISOString(),
      }));
  }
}
