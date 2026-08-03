import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FAILURE_TYPES,
  RECOVERY_RULES,
  RECOVERY_STRATEGIES,
  WRS_METADATA_VERSION,
} from "./paths.js";
import type { RecoverableWorker, RecoveryRecord } from "./types.js";

function seedWorker(
  partial: Omit<
    RecoverableWorker,
    "duplicateExecutionPrevented" | "neverExecuteWorkerBusinessLogic"
  >,
): RecoverableWorker {
  return {
    ...partial,
    duplicateExecutionPrevented: true,
    neverExecuteWorkerBusinessLogic: true,
  };
}

export const DEFAULT_SEED_RECOVERABLE_WORKERS: RecoverableWorker[] = [
  seedWorker({
    workerId: "wkr-strategy-01",
    workerName: "Strategy Analyst One",
    missionId: "mission-research-01",
    lifecycleStatus: "active",
    authorityLevel: "autonomous_worker_decision",
    available: true,
    failureCount: 0,
    lastFailureType: null,
    executionStatePreserved: true,
  }),
  seedWorker({
    workerId: "wkr-ops-01",
    workerName: "Operations Specialist One",
    missionId: "mission-ops-02",
    lifecycleStatus: "busy",
    authorityLevel: "manager_approval",
    available: true,
    failureCount: 1,
    lastFailureType: "timeout",
    executionStatePreserved: true,
  }),
  seedWorker({
    workerId: "wkr-commerce-01",
    workerName: "Commerce Specialist One",
    missionId: "mission-commerce-03",
    lifecycleStatus: "active",
    authorityLevel: "factory_approval",
    available: true,
    failureCount: 2,
    lastFailureType: "hang",
    executionStatePreserved: true,
  }),
  seedWorker({
    workerId: "wkr-support-01",
    workerName: "Support Coordinator One",
    missionId: "mission-support-04",
    lifecycleStatus: "idle",
    authorityLevel: "manager_approval",
    available: true,
    failureCount: 0,
    lastFailureType: null,
    executionStatePreserved: true,
  }),
  seedWorker({
    workerId: "wkr-failed-01",
    workerName: "Repeated Failure Worker",
    missionId: "mission-fragile-05",
    lifecycleStatus: "recovering",
    authorityLevel: "pillow_approval",
    available: false,
    failureCount: 4,
    lastFailureType: "crash",
    executionStatePreserved: true,
  }),
];

export type WorkerRecoverySystemConfiguration = {
  enabled: boolean;
  detectionRulesEnabled: boolean;
  recoveryRulesEnabled: boolean;
  escalationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  recoveryStrategies: string[];
  failureTypes: string[];
  recoveryRules: string[];
  seedWorkers: RecoverableWorker[];
  seedRecords: RecoveryRecord[];
  repeatedFailureThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-12 hard boundaries — force-locked true. */
  neverExecuteWorkerBusinessLogic: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  respectAuthorityMatrix: true;
  respectWorkerLifecycle: true;
  respectMissionCoordinationEngine: true;
  preserveMissionIntegrity: true;
  preserveAuditHistory: true;
  preserveExecutionHistory: true;
  preventDuplicateExecution: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_RECOVERY_SYSTEM_CONFIGURATION: WorkerRecoverySystemConfiguration = {
  enabled: true,
  detectionRulesEnabled: true,
  recoveryRulesEnabled: true,
  escalationRulesEnabled: true,
  validationRulesEnabled: true,
  recoveryStrategies: [...RECOVERY_STRATEGIES],
  failureTypes: [...FAILURE_TYPES],
  recoveryRules: [...RECOVERY_RULES],
  seedWorkers: DEFAULT_SEED_RECOVERABLE_WORKERS,
  seedRecords: [],
  repeatedFailureThreshold: 3,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerBusinessLogic: true,
  neverReplaceWorkerMonitoring: true,
  neverReplaceWorkforceOrchestrator: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  respectAuthorityMatrix: true,
  respectWorkerLifecycle: true,
  respectMissionCoordinationEngine: true,
  preserveMissionIntegrity: true,
  preserveAuditHistory: true,
  preserveExecutionHistory: true,
  preventDuplicateExecution: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkerRecoverySystemConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerRecoverySystemConfiguration> = {},
): WorkerRecoverySystemConfiguration {
  let file: Partial<WorkerRecoverySystemConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-recovery-system.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_RECOVERY_SYSTEM_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.WORKER_RECOVERY_SYSTEM_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key: "recoveryStrategies" | "failureTypes" | "recoveryRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_RECOVERY_SYSTEM_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_RECOVERY_SYSTEM_CONFIGURATION,
    ...file,
    ...overrides,
    recoveryStrategies: mergeList("recoveryStrategies"),
    failureTypes: mergeList("failureTypes"),
    recoveryRules: mergeList("recoveryRules"),
    seedWorkers: (overrides.seedWorkers ??
      file.seedWorkers ??
      DEFAULT_SEED_RECOVERABLE_WORKERS
    ).map((w) => ({
      ...w,
      duplicateExecutionPrevented: true as const,
      neverExecuteWorkerBusinessLogic: true as const,
    })),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      supportingEvidence: [...r.supportingEvidence],
      optionsConsidered: r.optionsConsidered.map((o) => ({ ...o })),
      metadataVersion: r.metadataVersion || WRS_METADATA_VERSION,
      executionStatePreserved: true as const,
      neverExecuteWorkerBusinessLogic: true as const,
      neverReplaceWorkerMonitoring: true as const,
      neverReplaceWorkforceOrchestrator: true as const,
      neverOverridePillow: true as const,
      neverOverrideGrandKing: true as const,
      respectAuthorityMatrix: true as const,
      respectWorkerLifecycle: true as const,
      respectMissionCoordinationEngine: true as const,
      preserveMissionIntegrity: true as const,
      preserveAuditHistory: true as const,
      preserveExecutionHistory: true as const,
      preventDuplicateExecution: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerBusinessLogic: true,
    neverReplaceWorkerMonitoring: true,
    neverReplaceWorkforceOrchestrator: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    respectAuthorityMatrix: true,
    respectWorkerLifecycle: true,
    respectMissionCoordinationEngine: true,
    preserveMissionIntegrity: true,
    preserveAuditHistory: true,
    preserveExecutionHistory: true,
    preventDuplicateExecution: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
