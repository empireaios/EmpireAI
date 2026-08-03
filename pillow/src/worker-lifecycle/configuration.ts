import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIFECYCLE_RULES, LIFECYCLE_STATES } from "./paths.js";
import type { LifecycleRecord, WorkerLifecycleProfile } from "./types.js";

export type WorkerLifecycleConfiguration = {
  enabled: boolean;
  transitionRulesEnabled: boolean;
  auditRulesEnabled: boolean;
  restorationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  lifecycleStates: string[];
  lifecycleRules: string[];
  seedProfiles: WorkerLifecycleProfile[];
  seedRecords: LifecycleRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-08 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerRegistry: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPermanentlyDeleted: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_LIFECYCLE_CONFIGURATION: WorkerLifecycleConfiguration = {
  enabled: true,
  transitionRulesEnabled: true,
  auditRulesEnabled: true,
  restorationRulesEnabled: true,
  validationRulesEnabled: true,
  lifecycleStates: [...LIFECYCLE_STATES],
  lifecycleRules: [...LIFECYCLE_RULES],
  seedProfiles: [],
  seedRecords: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceWorkerRegistry: true,
  neverReplaceWorkforceCertificationMonitor: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverPermanentlyDeleted: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveAuditability: true,
  preserveTraceability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkerLifecycleConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerLifecycleConfiguration> = {},
): WorkerLifecycleConfiguration {
  let file: Partial<WorkerLifecycleConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-lifecycle.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_LIFECYCLE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_LIFECYCLE_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "lifecycleStates" | "lifecycleRules") =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_LIFECYCLE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_LIFECYCLE_CONFIGURATION,
    ...file,
    ...overrides,
    lifecycleStates: mergeList("lifecycleStates"),
    lifecycleRules: mergeList("lifecycleRules"),
    seedProfiles: (overrides.seedProfiles ?? file.seedProfiles ?? []).map((p) => ({
      ...p,
      history: p.history.map((h) => ({
        ...h,
        supportingEvidence: [...h.supportingEvidence],
      })),
      neverPermanentlyDeleted: true as const,
    })),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      supportingEvidence: [...r.supportingEvidence],
      permanentlyDeleted: false as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkerRegistry: true,
    neverReplaceWorkforceCertificationMonitor: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverPermanentlyDeleted: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
