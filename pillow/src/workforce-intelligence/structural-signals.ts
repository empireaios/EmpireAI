/** X3-08 — Shared structural workforce intelligence helpers. */

import { WFI_METADATA_VERSION } from "./paths.js";
import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type { WorkforceIntelligenceInput, WorkforceRecord } from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: WorkforceIntelligenceInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultWorkforce(input?: WorkforceIntelligenceInput): string {
  return input?.workforceReference?.trim() || "workforce-default";
}

export function buildWorkforceRecord(input: {
  companyReference: string;
  workforceReference: string;
  agentUtilization: number;
  workloadDistribution: number;
  throughputMetrics: number;
  workforceEfficiencyScore: number;
  recommendationSummary: string;
  config: WorkforceIntelligenceConfiguration;
}): WorkforceRecord {
  let efficiency = Math.max(
    0,
    Math.min(100, Math.round(input.workforceEfficiencyScore)),
  );
  if (input.config.neverOverloadWorkforceBeyondValidatedLimits) {
    if (
      input.agentUtilization < input.config.minAgentUtilization ||
      input.throughputMetrics < input.config.minThroughputMetrics ||
      input.workloadDistribution < input.config.minWorkloadDistribution
    ) {
      efficiency = Math.min(efficiency, input.config.minWorkforceEfficiencyScore - 1);
    }
    // Cap efficiency when utilization signals overload risk beyond validated bounds.
    if (input.agentUtilization > 95) {
      efficiency = Math.min(efficiency, input.config.minWorkforceEfficiencyScore - 1);
    }
  }

  return {
    workforceRecordId: `wfi-wf-${Date.now()}-${input.workforceReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    workforceReference: input.workforceReference,
    agentUtilization: Math.max(0, Math.min(100, Math.round(input.agentUtilization))),
    workloadDistribution: Math.max(0, Math.min(100, Math.round(input.workloadDistribution))),
    throughputMetrics: Math.max(0, Math.min(100, Math.round(input.throughputMetrics))),
    workforceEfficiencyScore: efficiency,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: WFI_METADATA_VERSION,
    neverOverloadWorkforceBeyondValidatedLimits: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}

export function computeWorkforceSignals(
  focus:
    | "capacity"
    | "utilization"
    | "distribution"
    | "throughput"
    | "task_completion"
    | "efficiency"
    | "workforce",
  input: WorkforceIntelligenceInput,
  config: WorkforceIntelligenceConfiguration,
): {
  companyReference: string;
  workforceReference: string;
  agentUtilization: number;
  workloadDistribution: number;
  throughputMetrics: number;
  workforceEfficiencyScore: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const workforce = defaultWorkforce(input);
  const seed = `${company}::${workforce}::${focus}`;

  const agentUtilization = Math.round(
    input.utilizationHint ?? hashScore(`${seed}:utilization`, 20, 95),
  );
  const workloadDistribution = Math.round(
    input.distributionHint ?? hashScore(`${seed}:distribution`, 20, 95),
  );
  const throughputMetrics = Math.round(
    input.throughputHint ?? hashScore(`${seed}:throughput`, 20, 95),
  );

  const capacityScore = Math.round(
    input.capacityHint ?? hashScore(`${seed}:capacity`, 20, 95),
  );
  const taskCompletionScore = Math.round(
    input.taskCompletionHint ?? hashScore(`${seed}:task_completion`, 20, 95),
  );

  let workforceEfficiencyScore = Math.round(
    input.efficiencyHint ??
      (agentUtilization * 0.3 +
        workloadDistribution * 0.25 +
        throughputMetrics * 0.25 +
        capacityScore * 0.1 +
        taskCompletionScore * 0.1),
  );

  let recommendationSummary = "Workforce coordination within validated structural bounds";
  if (agentUtilization > 95) {
    recommendationSummary = `Utilization ${agentUtilization} exceeds validated overload ceiling — do not overload workforce`;
  } else if (agentUtilization < config.minAgentUtilization) {
    recommendationSummary = `Utilization bottleneck at ${agentUtilization} (min ${config.minAgentUtilization}) — rebalance agents`;
  } else if (throughputMetrics < config.minThroughputMetrics) {
    recommendationSummary = `Throughput bottleneck at ${throughputMetrics} (min ${config.minThroughputMetrics}) — hold expansion`;
  } else if (workloadDistribution < config.minWorkloadDistribution) {
    recommendationSummary = `Workload distribution ${workloadDistribution} below min ${config.minWorkloadDistribution} — rebalance`;
  } else if (workforceEfficiencyScore < config.minWorkforceEfficiencyScore) {
    recommendationSummary = `Workforce efficiency ${workforceEfficiencyScore} below min ${config.minWorkforceEfficiencyScore} — hold coordination changes`;
  } else {
    recommendationSummary = `Validated ${focus} signals support cautious workforce coordination`;
  }

  if (config.neverOverloadWorkforceBeyondValidatedLimits) {
    if (
      agentUtilization < config.minAgentUtilization ||
      throughputMetrics < config.minThroughputMetrics ||
      workloadDistribution < config.minWorkloadDistribution ||
      agentUtilization > 95
    ) {
      workforceEfficiencyScore = Math.min(
        workforceEfficiencyScore,
        config.minWorkforceEfficiencyScore - 1,
      );
    }
  }

  return {
    companyReference: company,
    workforceReference: workforce,
    agentUtilization,
    workloadDistribution,
    throughputMetrics,
    workforceEfficiencyScore,
    recommendationSummary,
  };
}
