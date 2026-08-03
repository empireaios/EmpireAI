import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OPTIMIZATION_TARGETS } from "./paths.js";
import type { OptimizationRecord } from "./types.js";

export type AdaptiveWorkforceOptimizerConfiguration = {
  enabled: boolean;
  analysisRulesEnabled: boolean;
  detectionRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  optimizationTargets: string[];
  overloadedThreshold: number;
  underutilizedThreshold: number;
  idleThreshold: number;
  seedOptimizations: OptimizationRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-17 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverModifyWorkersAutomatically: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveOptimizationTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_OPTIMIZATIONS: OptimizationRecord[] = [];

export const DEFAULT_ADAPTIVE_WORKFORCE_OPTIMIZER_CONFIGURATION: AdaptiveWorkforceOptimizerConfiguration =
  {
    enabled: true,
    analysisRulesEnabled: true,
    detectionRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    optimizationTargets: [...OPTIMIZATION_TARGETS],
    overloadedThreshold: 85,
    underutilizedThreshold: 35,
    idleThreshold: 15,
    seedOptimizations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverModifyWorkersAutomatically: true,
    neverReplacePillow: true,
    neverOverrideGrandKing: true,
    neverPerformStrategicPlanning: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildAdaptiveWorkforceOptimizerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AdaptiveWorkforceOptimizerConfiguration> = {},
): AdaptiveWorkforceOptimizerConfiguration {
  let file: Partial<AdaptiveWorkforceOptimizerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "adaptive-workforce-optimizer.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ADAPTIVE_WORKFORCE_OPTIMIZER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.ADAPTIVE_WORKFORCE_OPTIMIZER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedTargets = Array.from(
    new Set([
      ...DEFAULT_ADAPTIVE_WORKFORCE_OPTIMIZER_CONFIGURATION.optimizationTargets,
      ...(file.optimizationTargets ?? []),
      ...(overrides.optimizationTargets ?? []),
    ]),
  );

  return {
    ...DEFAULT_ADAPTIVE_WORKFORCE_OPTIMIZER_CONFIGURATION,
    ...file,
    ...overrides,
    optimizationTargets: mergedTargets,
    seedOptimizations: (overrides.seedOptimizations ?? file.seedOptimizations ?? []).map((r) => ({
      ...r,
      workers: [...r.workers],
      bottlenecks: [...r.bottlenecks],
      improvementOpportunities: [...r.improvementOpportunities],
      recommendedChanges: r.recommendedChanges.map((c) => ({
        ...c,
        affectedWorkers: [...c.affectedWorkers],
      })),
      expectedBenefits: [...r.expectedBenefits],
      supportingEvidence: [...r.supportingEvidence],
      overloadedWorkers: [...r.overloadedWorkers],
      underutilizedWorkers: [...r.underutilizedWorkers],
      idleWorkers: [...r.idleWorkers],
      optimizationTargetsAddressed: [...r.optimizationTargetsAddressed],
      currentPerformance: { ...r.currentPerformance },
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverModifyWorkersAutomatically: true,
    neverReplacePillow: true,
    neverOverrideGrandKing: true,
    neverPerformStrategicPlanning: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
