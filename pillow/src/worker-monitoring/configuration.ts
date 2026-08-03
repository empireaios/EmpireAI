import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MONITORING_EVENTS,
  MONITORING_RULES,
  WMO_METADATA_VERSION,
  WORKER_HEALTH_STATES,
} from "./paths.js";
import type { MonitoredWorker, MonitoringRecord } from "./types.js";

function seedWorker(
  partial: Omit<MonitoredWorker, "neverExecuteWorkerTasks">,
): MonitoredWorker {
  return { ...partial, neverExecuteWorkerTasks: true };
}

const now = "2026-07-30T00:00:00.000Z";

export const DEFAULT_SEED_MONITORED_WORKERS: MonitoredWorker[] = [
  seedWorker({
    workerId: "wkr-strategy-01",
    workerName: "Strategy Analyst One",
    department: "strategy",
    currentMission: "mission-research-01",
    available: true,
    active: true,
    progress: 0.72,
    currentWorkload: 0.35,
    errorCount: 0,
    repeatedErrorCount: 0,
    executionTimeMs: 120000,
    expectedExecutionTimeMs: 180000,
    resourceUsage: 0.4,
    qualityScore: 0.91,
    performanceScore: 0.9,
    lastHeartbeatAt: now,
    stallThresholdMs: 300000,
  }),
  seedWorker({
    workerId: "wkr-ops-01",
    workerName: "Operations Specialist One",
    department: "operations",
    currentMission: "mission-ops-02",
    available: true,
    active: true,
    progress: 0.2,
    currentWorkload: 0.88,
    errorCount: 2,
    repeatedErrorCount: 2,
    executionTimeMs: 420000,
    expectedExecutionTimeMs: 200000,
    resourceUsage: 0.82,
    qualityScore: 0.7,
    performanceScore: 0.55,
    lastHeartbeatAt: now,
    stallThresholdMs: 300000,
  }),
  seedWorker({
    workerId: "wkr-commerce-01",
    workerName: "Commerce Specialist One",
    department: "commerce",
    currentMission: "mission-commerce-03",
    available: true,
    active: true,
    progress: 0.05,
    currentWorkload: 0.6,
    errorCount: 1,
    repeatedErrorCount: 0,
    executionTimeMs: 600000,
    expectedExecutionTimeMs: 240000,
    resourceUsage: 0.5,
    qualityScore: 0.65,
    performanceScore: 0.48,
    lastHeartbeatAt: "2026-07-29T20:00:00.000Z",
    stallThresholdMs: 300000,
  }),
  seedWorker({
    workerId: "wkr-support-01",
    workerName: "Support Coordinator One",
    department: "customer_support",
    currentMission: null,
    available: true,
    active: false,
    progress: 1,
    currentWorkload: 0.1,
    errorCount: 0,
    repeatedErrorCount: 0,
    executionTimeMs: 90000,
    expectedExecutionTimeMs: 120000,
    resourceUsage: 0.2,
    qualityScore: 0.93,
    performanceScore: 0.92,
    lastHeartbeatAt: now,
    stallThresholdMs: 300000,
  }),
  seedWorker({
    workerId: "wkr-offline-01",
    workerName: "Offline Analyst",
    department: "strategy",
    currentMission: "mission-offline",
    available: false,
    active: false,
    progress: 0.1,
    currentWorkload: 0,
    errorCount: 4,
    repeatedErrorCount: 3,
    executionTimeMs: 0,
    expectedExecutionTimeMs: 180000,
    resourceUsage: 0,
    qualityScore: 0.4,
    performanceScore: 0.2,
    lastHeartbeatAt: "2026-07-28T00:00:00.000Z",
    stallThresholdMs: 300000,
  }),
];

export type WorkerMonitoringConfiguration = {
  enabled: boolean;
  observationRulesEnabled: boolean;
  anomalyRulesEnabled: boolean;
  alertRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthStates: string[];
  monitoringEvents: string[];
  monitoringRules: string[];
  seedWorkers: MonitoredWorker[];
  seedRecords: MonitoringRecord[];
  stallThresholdMs: number;
  overloadWorkloadThreshold: number;
  driftRatioThreshold: number;
  performanceDegradeThreshold: number;
  offlineHeartbeatMs: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-10 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverRestartWorkersAutomatically: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveMonitoringHistory: true;
  supportsExecutiveReportingRuntime: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_MONITORING_CONFIGURATION: WorkerMonitoringConfiguration = {
  enabled: true,
  observationRulesEnabled: true,
  anomalyRulesEnabled: true,
  alertRulesEnabled: true,
  validationRulesEnabled: true,
  healthStates: [...WORKER_HEALTH_STATES],
  monitoringEvents: [...MONITORING_EVENTS],
  monitoringRules: [...MONITORING_RULES],
  seedWorkers: DEFAULT_SEED_MONITORED_WORKERS,
  seedRecords: [],
  stallThresholdMs: 300000,
  overloadWorkloadThreshold: 0.85,
  driftRatioThreshold: 1.75,
  performanceDegradeThreshold: 0.6,
  offlineHeartbeatMs: 900000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverRestartWorkersAutomatically: true,
  neverReplaceWorkforceCertificationMonitor: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveMonitoringHistory: true,
  supportsExecutiveReportingRuntime: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkerMonitoringConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerMonitoringConfiguration> = {},
): WorkerMonitoringConfiguration {
  let file: Partial<WorkerMonitoringConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-monitoring.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_MONITORING_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_MONITORING_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key: "healthStates" | "monitoringEvents" | "monitoringRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_MONITORING_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_MONITORING_CONFIGURATION,
    ...file,
    ...overrides,
    healthStates: mergeList("healthStates"),
    monitoringEvents: mergeList("monitoringEvents"),
    monitoringRules: mergeList("monitoringRules"),
    seedWorkers: (overrides.seedWorkers ??
      file.seedWorkers ??
      DEFAULT_SEED_MONITORED_WORKERS
    ).map((w) => ({ ...w, neverExecuteWorkerTasks: true as const })),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      alerts: r.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
      events: [...r.events],
      metadataVersion: r.metadataVersion || WMO_METADATA_VERSION,
      neverExecuteWorkerTasks: true as const,
      neverRestartWorkersAutomatically: true as const,
      neverReplaceWorkforceCertificationMonitor: true as const,
      neverOverridePillow: true as const,
      neverOverrideGrandKing: true as const,
      preserveMonitoringHistory: true as const,
      supportsExecutiveReportingRuntime: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverRestartWorkersAutomatically: true,
    neverReplaceWorkforceCertificationMonitor: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveMonitoringHistory: true,
    supportsExecutiveReportingRuntime: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
