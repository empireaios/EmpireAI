import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_TYPES,
  INTEGRATION_TARGETS,
  LAUNCH_PLAN_WORKER_IDENTITY,
  LAUNCH_STAGE_CATALOG,
  LPW_METADATA_VERSION,
} from "./paths.js";
import type { LaunchPlan } from "./types.js";

export type LaunchPlanWorkerConfiguration = {
  enabled: boolean;
  planningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireApprovedBlueprint: boolean;
  businessTypes: string[];
  stageCatalog: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedLaunchPlans: LaunchPlan[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-07 hard boundaries — force-locked true. */
  neverExecuteLaunchTasks: true;
  neverAssignWorkersDirectly: true;
  neverCreateBusinessAssets: true;
  neverConnectExternalAccounts: true;
  neverLaunchBusiness: true;
  neverApproveLaunch: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ208OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_LAUNCH_PLAN_WORKER_CONFIGURATION: LaunchPlanWorkerConfiguration = {
  enabled: true,
  planningRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireApprovedBlueprint: true,
  businessTypes: [...BUSINESS_TYPES],
  stageCatalog: [...LAUNCH_STAGE_CATALOG],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: LAUNCH_PLAN_WORKER_IDENTITY.workerId,
  workerName: LAUNCH_PLAN_WORKER_IDENTITY.workerName,
  factory: LAUNCH_PLAN_WORKER_IDENTITY.factory,
  department: LAUNCH_PLAN_WORKER_IDENTITY.department,
  role: LAUNCH_PLAN_WORKER_IDENTITY.role,
  reportingLine: [...LAUNCH_PLAN_WORKER_IDENTITY.reportingLine],
  seedLaunchPlans: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteLaunchTasks: true,
  neverAssignWorkersDirectly: true,
  neverCreateBusinessAssets: true,
  neverConnectExternalAccounts: true,
  neverLaunchBusiness: true,
  neverApproveLaunch: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ208OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildLaunchPlanWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LaunchPlanWorkerConfiguration> = {},
): LaunchPlanWorkerConfiguration {
  let file: Partial<LaunchPlanWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "launch-plan-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.LAUNCH_PLAN_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.LAUNCH_PLAN_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "businessTypes" | "stageCatalog" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_LAUNCH_PLAN_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_LAUNCH_PLAN_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    stageCatalog: mergeList("stageCatalog"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LAUNCH_PLAN_WORKER_CONFIGURATION.reportingLine),
    ],
    seedLaunchPlans: (overrides.seedLaunchPlans ?? file.seedLaunchPlans ?? []).map((p) =>
      lockPlan(p),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteLaunchTasks: true,
    neverAssignWorkersDirectly: true,
    neverCreateBusinessAssets: true,
    neverConnectExternalAccounts: true,
    neverLaunchBusiness: true,
    neverApproveLaunch: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ208OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockPlan(plan: LaunchPlan): LaunchPlan {
  return {
    ...plan,
    launchStages: plan.launchStages.map((s) => ({
      ...s,
      dependsOnStages: [...s.dependsOnStages],
      derivedFrom: [...s.derivedFrom],
    })),
    milestones: plan.milestones.map((m) => ({
      ...m,
      measurableCriteria: [...m.measurableCriteria],
      dependsOn: [...m.dependsOn],
    })),
    tasks: plan.tasks.map((t) => ({
      ...t,
      dependsOn: [...t.dependsOn],
      requiredTools: [...t.requiredTools],
    })),
    dependencies: plan.dependencies.map((d) => ({ ...d })),
    requiredWorkforce: plan.requiredWorkforce.map((w) => ({
      ...w,
      skills: [...w.skills],
    })),
    requiredTools: [...plan.requiredTools],
    approvalCheckpoints: plan.approvalCheckpoints.map((c) => ({
      ...c,
      requiredEvidence: [...c.requiredEvidence],
    })),
    validationCheckpoints: plan.validationCheckpoints.map((c) => ({
      ...c,
      requiredEvidence: [...c.requiredEvidence],
    })),
    launchPrerequisites: [...plan.launchPrerequisites],
    blockers: plan.blockers.map((b) => ({ ...b, blocks: [...b.blocks] })),
    rollbackConditions: plan.rollbackConditions.map((r) => ({ ...r })),
    completionCriteria: [...plan.completionCriteria],
    missingPrerequisites: [...plan.missingPrerequisites],
    preservedDecisions: [...plan.preservedDecisions],
    traceabilityRefs: [...plan.traceabilityRefs],
    metadataVersion: plan.metadataVersion || LPW_METADATA_VERSION,
    neverExecuteLaunchTasks: true,
    neverAssignWorkersDirectly: true,
    neverCreateBusinessAssets: true,
    neverConnectExternalAccounts: true,
    neverLaunchBusiness: true,
    neverApproveLaunch: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
