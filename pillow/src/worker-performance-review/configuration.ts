import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PERFORMANCE_METRICS,
  PERFORMANCE_RATINGS,
  PERFORMANCE_RULES,
  WPR_METADATA_VERSION,
} from "./paths.js";
import type { MetricScores, PerformanceRecord, PerformanceWorker } from "./types.js";

function scores(partial: Partial<MetricScores>): MetricScores {
  return {
    quality: 0.8,
    accuracy: 0.8,
    speed: 0.8,
    reliability: 0.8,
    consistency: 0.8,
    collaboration: 0.8,
    recovery: 0.8,
    efficiency: 0.8,
    businessValue: 0.8,
    governanceCompliance: 0.9,
    approvalRate: 0.85,
    reviewOutcome: 0.85,
    ...partial,
  };
}

function seedWorker(
  partial: Omit<PerformanceWorker, "neverExecuteWorkerTasks">,
): PerformanceWorker {
  return { ...partial, neverExecuteWorkerTasks: true };
}

export const DEFAULT_SEED_PERFORMANCE_WORKERS: PerformanceWorker[] = [
  seedWorker({
    workerId: "wkr-strategy-01",
    workerName: "Strategy Analyst One",
    department: "strategy",
    active: true,
    metrics: scores({
      quality: 0.94,
      accuracy: 0.93,
      speed: 0.88,
      reliability: 0.95,
      consistency: 0.92,
      collaboration: 0.86,
      recovery: 0.9,
      efficiency: 0.89,
      businessValue: 0.91,
      governanceCompliance: 0.97,
      approvalRate: 0.94,
      reviewOutcome: 0.93,
    }),
  }),
  seedWorker({
    workerId: "wkr-ops-01",
    workerName: "Operations Specialist One",
    department: "operations",
    active: true,
    metrics: scores({
      quality: 0.72,
      accuracy: 0.7,
      speed: 0.65,
      reliability: 0.68,
      consistency: 0.66,
      collaboration: 0.74,
      recovery: 0.6,
      efficiency: 0.62,
      businessValue: 0.67,
      governanceCompliance: 0.8,
      approvalRate: 0.7,
      reviewOutcome: 0.68,
    }),
  }),
  seedWorker({
    workerId: "wkr-commerce-01",
    workerName: "Commerce Specialist One",
    department: "commerce",
    active: true,
    metrics: scores({
      quality: 0.81,
      accuracy: 0.79,
      speed: 0.77,
      reliability: 0.8,
      consistency: 0.78,
      collaboration: 0.83,
      recovery: 0.76,
      efficiency: 0.75,
      businessValue: 0.84,
      governanceCompliance: 0.88,
      approvalRate: 0.82,
      reviewOutcome: 0.8,
    }),
  }),
  seedWorker({
    workerId: "wkr-support-01",
    workerName: "Support Coordinator One",
    department: "customer_support",
    active: true,
    metrics: scores({
      quality: 0.9,
      accuracy: 0.91,
      speed: 0.87,
      reliability: 0.92,
      consistency: 0.89,
      collaboration: 0.94,
      recovery: 0.88,
      efficiency: 0.86,
      businessValue: 0.85,
      governanceCompliance: 0.93,
      approvalRate: 0.9,
      reviewOutcome: 0.91,
    }),
  }),
  seedWorker({
    workerId: "wkr-idle-01",
    workerName: "Idle Analyst",
    department: "strategy",
    active: false,
    metrics: scores({
      quality: 0.55,
      accuracy: 0.5,
      speed: 0.45,
      reliability: 0.48,
      consistency: 0.5,
      collaboration: 0.4,
      recovery: 0.42,
      efficiency: 0.44,
      businessValue: 0.4,
      governanceCompliance: 0.7,
      approvalRate: 0.5,
      reviewOutcome: 0.48,
    }),
  }),
];

export type WorkerPerformanceReviewConfiguration = {
  enabled: boolean;
  reviewRulesEnabled: boolean;
  trendRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  performanceMetrics: string[];
  performanceRatings: string[];
  performanceRules: string[];
  seedWorkers: PerformanceWorker[];
  seedRecords: PerformanceRecord[];
  defaultReviewPeriod: string;
  outstandingThreshold: number;
  excellentThreshold: number;
  goodThreshold: number;
  acceptableThreshold: number;
  needsImprovementThreshold: number;
  improvingDeltaThreshold: number;
  decliningDeltaThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-11 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  integratesWithWorkerAssignmentEngine: true;
  integratesWithWorkforceCertificationMonitor: true;
  integratesWithAdaptiveWorkforceOptimizer: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveHistoricalPerformance: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_PERFORMANCE_REVIEW_CONFIGURATION: WorkerPerformanceReviewConfiguration =
  {
    enabled: true,
    reviewRulesEnabled: true,
    trendRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    performanceMetrics: [...PERFORMANCE_METRICS],
    performanceRatings: [...PERFORMANCE_RATINGS],
    performanceRules: [...PERFORMANCE_RULES],
    seedWorkers: DEFAULT_SEED_PERFORMANCE_WORKERS,
    seedRecords: [],
    defaultReviewPeriod: "2026-Q3",
    outstandingThreshold: 0.93,
    excellentThreshold: 0.87,
    goodThreshold: 0.78,
    acceptableThreshold: 0.68,
    needsImprovementThreshold: 0.55,
    improvingDeltaThreshold: 0.03,
    decliningDeltaThreshold: -0.03,
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkerMonitoring: true,
    neverReplaceWorkforceCertificationMonitor: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    integratesWithWorkerAssignmentEngine: true,
    integratesWithWorkforceCertificationMonitor: true,
    integratesWithAdaptiveWorkforceOptimizer: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveHistoricalPerformance: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildWorkerPerformanceReviewConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerPerformanceReviewConfiguration> = {},
): WorkerPerformanceReviewConfiguration {
  let file: Partial<WorkerPerformanceReviewConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-performance-review.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_PERFORMANCE_REVIEW_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.WORKER_PERFORMANCE_REVIEW_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key: "performanceMetrics" | "performanceRatings" | "performanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_PERFORMANCE_REVIEW_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_PERFORMANCE_REVIEW_CONFIGURATION,
    ...file,
    ...overrides,
    performanceMetrics: mergeList("performanceMetrics"),
    performanceRatings: mergeList("performanceRatings"),
    performanceRules: mergeList("performanceRules"),
    seedWorkers: (overrides.seedWorkers ??
      file.seedWorkers ??
      DEFAULT_SEED_PERFORMANCE_WORKERS
    ).map((w) => ({
      ...w,
      metrics: { ...w.metrics },
      neverExecuteWorkerTasks: true as const,
    })),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      improvementRecommendations: [...r.improvementRecommendations],
      metricScores: { ...r.metricScores },
      trend: { ...r.trend, notes: [...r.trend.notes] },
      metadataVersion: r.metadataVersion || WPR_METADATA_VERSION,
      neverExecuteWorkerTasks: true as const,
      neverReplaceWorkerMonitoring: true as const,
      neverReplaceWorkforceCertificationMonitor: true as const,
      neverOverridePillow: true as const,
      neverOverrideGrandKing: true as const,
      integratesWithWorkerAssignmentEngine: true as const,
      integratesWithWorkforceCertificationMonitor: true as const,
      integratesWithAdaptiveWorkforceOptimizer: true as const,
      preserveHistoricalPerformance: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkerMonitoring: true,
    neverReplaceWorkforceCertificationMonitor: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    integratesWithWorkerAssignmentEngine: true,
    integratesWithWorkforceCertificationMonitor: true,
    integratesWithAdaptiveWorkforceOptimizer: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveHistoricalPerformance: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
