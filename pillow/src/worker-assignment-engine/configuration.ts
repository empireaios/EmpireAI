import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ASSIGNMENT_FACTORS,
  ASSIGNMENT_RULES,
  WAE_METADATA_VERSION,
} from "./paths.js";
import type { AssignmentRecord, AssignmentWorker } from "./types.js";

function seedWorker(
  partial: Omit<AssignmentWorker, "neverExecuteWorkerTasks">,
): AssignmentWorker {
  return { ...partial, neverExecuteWorkerTasks: true };
}

export const DEFAULT_SEED_ASSIGNMENT_WORKERS: AssignmentWorker[] = [
  seedWorker({
    workerId: "wkr-strategy-01",
    workerName: "Strategy Analyst One",
    skills: ["skill-research-synthesis", "skill-analytics-metrics"],
    certificationStatus: "certified",
    available: true,
    lifecycleStatus: "active",
    workload: 0.2,
    authorityLevel: "autonomous_worker_decision",
    approvedTools: ["research_notebook", "metrics_warehouse"],
    dependencyIds: [],
    riskScore: 0.15,
    costScore: 0.25,
    historicalPerformance: 0.92,
    responsibilityDomains: ["strategy", "research"],
  }),
  seedWorker({
    workerId: "wkr-ops-01",
    workerName: "Operations Specialist One",
    skills: ["skill-ops-process", "skill-ops-foundation"],
    certificationStatus: "certified",
    available: true,
    lifecycleStatus: "idle",
    workload: 0.1,
    authorityLevel: "manager_approval",
    approvedTools: ["ops_runbook", "structured_reporting"],
    dependencyIds: ["dep-ops-channel"],
    riskScore: 0.2,
    costScore: 0.3,
    historicalPerformance: 0.88,
    responsibilityDomains: ["operations"],
  }),
  seedWorker({
    workerId: "wkr-commerce-01",
    workerName: "Commerce Specialist One",
    skills: ["skill-commerce-marketplace", "skill-business-strategy"],
    certificationStatus: "certified",
    available: true,
    lifecycleStatus: "busy",
    workload: 0.75,
    authorityLevel: "factory_approval",
    approvedTools: ["commerce_console", "inventory_feed"],
    dependencyIds: ["dep-commerce-feed"],
    riskScore: 0.35,
    costScore: 0.45,
    historicalPerformance: 0.84,
    responsibilityDomains: ["commerce"],
  }),
  seedWorker({
    workerId: "wkr-eng-01",
    workerName: "Engineering Specialist One",
    skills: ["skill-engineering-software", "skill-engineering-automation"],
    certificationStatus: "pending",
    available: true,
    lifecycleStatus: "registered",
    workload: 0.0,
    authorityLevel: "pillow_approval",
    approvedTools: ["code_workspace", "ci_pipeline"],
    dependencyIds: [],
    riskScore: 0.4,
    costScore: 0.5,
    historicalPerformance: 0.7,
    responsibilityDomains: ["engineering"],
  }),
  seedWorker({
    workerId: "wkr-support-01",
    workerName: "Support Coordinator One",
    skills: ["skill-customer-support-service", "skill-ops-foundation"],
    certificationStatus: "certified",
    available: true,
    lifecycleStatus: "active",
    workload: 0.35,
    authorityLevel: "manager_approval",
    approvedTools: ["support_desk", "structured_reporting"],
    dependencyIds: ["dep-support-queue"],
    riskScore: 0.22,
    costScore: 0.28,
    historicalPerformance: 0.9,
    responsibilityDomains: ["customer_support", "operations"],
  }),
  seedWorker({
    workerId: "wkr-suspended-01",
    workerName: "Suspended Analyst",
    skills: ["skill-research-synthesis"],
    certificationStatus: "certified",
    available: false,
    lifecycleStatus: "suspended",
    workload: 0.0,
    authorityLevel: "autonomous_worker_decision",
    approvedTools: ["research_notebook"],
    dependencyIds: [],
    riskScore: 0.5,
    costScore: 0.2,
    historicalPerformance: 0.6,
    responsibilityDomains: ["strategy"],
  }),
];

export type WorkerAssignmentEngineConfiguration = {
  enabled: boolean;
  discoveryRulesEnabled: boolean;
  evaluationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  assignmentFactors: string[];
  assignmentRules: string[];
  seedWorkers: AssignmentWorker[];
  seedRecords: AssignmentRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-09 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceTaskNegotiationProtocol: true;
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

export const DEFAULT_WORKER_ASSIGNMENT_ENGINE_CONFIGURATION: WorkerAssignmentEngineConfiguration =
  {
    enabled: true,
    discoveryRulesEnabled: true,
    evaluationRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    assignmentFactors: [...ASSIGNMENT_FACTORS],
    assignmentRules: [...ASSIGNMENT_RULES],
    seedWorkers: DEFAULT_SEED_ASSIGNMENT_WORKERS,
    seedRecords: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplaceTaskNegotiationProtocol: true,
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

export function buildWorkerAssignmentEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerAssignmentEngineConfiguration> = {},
): WorkerAssignmentEngineConfiguration {
  let file: Partial<WorkerAssignmentEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-assignment-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_ASSIGNMENT_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.WORKER_ASSIGNMENT_ENGINE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "assignmentFactors" | "assignmentRules") =>
    Array.from(
      new Set([
        ...DEFAULT_WORKER_ASSIGNMENT_ENGINE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKER_ASSIGNMENT_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    assignmentFactors: mergeList("assignmentFactors"),
    assignmentRules: mergeList("assignmentRules"),
    seedWorkers: (overrides.seedWorkers ??
      file.seedWorkers ??
      DEFAULT_SEED_ASSIGNMENT_WORKERS
    ).map((w) => ({
      ...w,
      skills: [...w.skills],
      approvedTools: [...w.approvedTools],
      dependencyIds: [...w.dependencyIds],
      responsibilityDomains: [...w.responsibilityDomains],
      neverExecuteWorkerTasks: true as const,
    })),
    seedRecords: (overrides.seedRecords ?? file.seedRecords ?? []).map((r) => ({
      ...r,
      missionRequirements: {
        ...r.missionRequirements,
        requiredSkills: [...r.missionRequirements.requiredSkills],
        requiredTools: [...r.missionRequirements.requiredTools],
        dependencyIds: [...r.missionRequirements.dependencyIds],
      },
      candidateWorkers: [...r.candidateWorkers],
      evaluationCriteria: [...r.evaluationCriteria],
      supportingWorkers: [...r.supportingWorkers],
      riskAssessment: {
        ...r.riskAssessment,
        notes: [...r.riskAssessment.notes],
      },
      evaluations: r.evaluations.map((e) => ({
        ...e,
        factorScores: { ...e.factorScores },
        rejectionReasons: [...e.rejectionReasons],
        evaluationNotes: [...e.evaluationNotes],
      })),
      metadataVersion: r.metadataVersion || WAE_METADATA_VERSION,
      neverExecuteWorkerTasks: true as const,
      neverReplaceWorkforceOrchestrator: true as const,
      neverReplaceTaskNegotiationProtocol: true as const,
      neverOverridePillow: true as const,
      neverOverrideGrandKing: true as const,
      preserveAuditability: true as const,
      preserveTraceability: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOrchestrator: true,
    neverReplaceTaskNegotiationProtocol: true,
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
