import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REGISTRY_RULES,
  REGISTRY_VERSION,
  WORKER_STATES,
  WRG_METADATA_VERSION,
} from "./paths.js";
import type { WorkerRecord } from "./types.js";

function seedWorker(
  partial: Omit<
    WorkerRecord,
    | "registryVersion"
    | "metadataVersion"
    | "governingAuthority"
    | "neverExecuteWorkerTasks"
    | "neverReplaceWorkforceCapabilityRegistry"
    | "neverReplaceOrganizationCharter"
    | "neverOverridePillow"
    | "neverOverrideGrandKing"
    | "preserveAuditability"
    | "preserveTraceability"
    | "structuralSignalOnly"
    | "maskSensitiveValues"
  >,
): WorkerRecord {
  return {
    ...partial,
    registryVersion: REGISTRY_VERSION,
    metadataVersion: WRG_METADATA_VERSION,
    governingAuthority: "pillow",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

const now = "2026-07-29T00:00:00.000Z";

export const DEFAULT_SEED_WORKERS: WorkerRecord[] = [
  seedWorker({
    workerId: "wkr-strategy-01",
    workerName: "Strategy Analyst One",
    workerType: "analyst",
    department: "strategy",
    factory: "workforce-factory",
    role: "role-analyst-strategy",
    reportingLine: ["wkr-strategy-01", "role-lead-team", "role-manager-department", "pillow"],
    skillProfile: ["skill-research-synthesis", "skill-analytics-metrics"],
    approvedTools: ["research_notebook", "metrics_warehouse"],
    authorityLevel: "autonomous_worker_decision",
    certificationStatus: "certified",
    operationalStatus: "active",
    createdDate: now,
    lastUpdated: now,
    versionHistory: [{ version: 1, updatedAt: now, changeSummary: "seeded" }],
  }),
  seedWorker({
    workerId: "wkr-ops-01",
    workerName: "Operations Specialist One",
    workerType: "specialist",
    department: "operations",
    factory: "workforce-factory",
    role: "role-specialist-domain",
    reportingLine: ["wkr-ops-01", "role-lead-team", "role-manager-department", "pillow"],
    skillProfile: ["skill-ops-process", "skill-ops-foundation"],
    approvedTools: ["ops_runbook", "structured_reporting"],
    authorityLevel: "manager_approval",
    certificationStatus: "certified",
    operationalStatus: "idle",
    createdDate: now,
    lastUpdated: now,
    versionHistory: [{ version: 1, updatedAt: now, changeSummary: "seeded" }],
  }),
  seedWorker({
    workerId: "wkr-commerce-01",
    workerName: "Commerce Specialist One",
    workerType: "specialist",
    department: "commerce",
    factory: "commerce-factory",
    role: "role-specialist-domain",
    reportingLine: ["wkr-commerce-01", "role-manager-department", "role-director-operations", "pillow"],
    skillProfile: ["skill-commerce-marketplace", "skill-business-strategy"],
    approvedTools: ["commerce_console", "inventory_feed"],
    authorityLevel: "factory_approval",
    certificationStatus: "certified",
    operationalStatus: "busy",
    createdDate: now,
    lastUpdated: now,
    versionHistory: [{ version: 1, updatedAt: now, changeSummary: "seeded" }],
  }),
  seedWorker({
    workerId: "wkr-eng-01",
    workerName: "Engineering Specialist One",
    workerType: "specialist",
    department: "engineering",
    factory: "workforce-factory",
    role: "role-specialist-domain",
    reportingLine: ["wkr-eng-01", "role-lead-team", "role-manager-department", "pillow"],
    skillProfile: ["skill-engineering-software", "skill-engineering-automation"],
    approvedTools: ["code_workspace", "ci_pipeline"],
    authorityLevel: "pillow_approval",
    certificationStatus: "pending",
    operationalStatus: "registered",
    createdDate: now,
    lastUpdated: now,
    versionHistory: [{ version: 1, updatedAt: now, changeSummary: "seeded" }],
  }),
  seedWorker({
    workerId: "wkr-support-01",
    workerName: "Support Coordinator One",
    workerType: "support",
    department: "customer_support",
    factory: "commerce-factory",
    role: "role-support-ops",
    reportingLine: ["wkr-support-01", "role-coordinator-mission", "role-manager-department", "pillow"],
    skillProfile: ["skill-customer-support-service"],
    approvedTools: ["support_desk"],
    authorityLevel: "manager_approval",
    certificationStatus: "certified",
    operationalStatus: "active",
    createdDate: now,
    lastUpdated: now,
    versionHistory: [{ version: 1, updatedAt: now, changeSummary: "seeded" }],
  }),
];

export type WorkerRegistryConfiguration = {
  enabled: boolean;
  registrationRulesEnabled: boolean;
  queryRulesEnabled: boolean;
  reportingRulesEnabled: boolean;
  statusRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  registryVersion: string;
  workerStates: string[];
  registryRules: string[];
  seedWorkers: WorkerRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-07 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_WORKER_REGISTRY_CONFIGURATION: WorkerRegistryConfiguration = {
  enabled: true,
  registrationRulesEnabled: true,
  queryRulesEnabled: true,
  reportingRulesEnabled: true,
  statusRulesEnabled: true,
  validationRulesEnabled: true,
  registryVersion: REGISTRY_VERSION,
  workerStates: [...WORKER_STATES],
  registryRules: [...REGISTRY_RULES],
  seedWorkers: DEFAULT_SEED_WORKERS,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceWorkforceCapabilityRegistry: true,
  neverReplaceOrganizationCharter: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveAuditability: true,
  preserveTraceability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkerRegistryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerRegistryConfiguration> = {},
): WorkerRegistryConfiguration {
  let file: Partial<WorkerRegistryConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-registry.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_REGISTRY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_REGISTRY_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "workerStates" | "registryRules") =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_REGISTRY_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  const cloneWorker = (w: WorkerRecord): WorkerRecord => ({
    ...w,
    reportingLine: [...w.reportingLine],
    skillProfile: [...w.skillProfile],
    approvedTools: [...w.approvedTools],
    versionHistory: w.versionHistory.map((v) => ({ ...v })),
    governingAuthority: "pillow",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  });

  return {
    ...DEFAULT_WORKER_REGISTRY_CONFIGURATION,
    ...file,
    ...overrides,
    workerStates: mergeList("workerStates"),
    registryRules: mergeList("registryRules"),
    seedWorkers: (overrides.seedWorkers ?? file.seedWorkers ?? DEFAULT_SEED_WORKERS).map(
      cloneWorker,
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceCapabilityRegistry: true,
    neverReplaceOrganizationCharter: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
