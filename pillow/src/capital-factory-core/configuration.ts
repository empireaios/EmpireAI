import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAPFC_METADATA_VERSION,
  CAPITAL_FACTORY_CORE_IDENTITY,
  CAPITAL_CATEGORIES,
  CAPITAL_WORKER_ROLES,
  INTEGRATION_TARGETS,
  LIFECYCLE_STATUSES,
  PROJECT_STATUSES,
} from "./paths.js";
import type { CapitalProject } from "./types.js";

export type CapitalFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  projectRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  capitalCategories: string[];
  lifecycleStatuses: string[];
  projectStatuses: string[];
  workerRoles: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedProjects: CapitalProject[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q9-01 hard boundaries — force-locked true. */
  neverPerformAccounting: true;
  neverForecastFinances: true;
  neverExecuteInvestmentsAutomatically: true;
  neverFabricateFinancialStatus: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ902OrLater: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_CAPITAL_FACTORY_CORE_CONFIGURATION: CapitalFactoryCoreConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  projectRulesEnabled: true,
  lifecycleRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  capitalCategories: [...CAPITAL_CATEGORIES],
  lifecycleStatuses: [...LIFECYCLE_STATUSES],
  projectStatuses: [...PROJECT_STATUSES],
  workerRoles: [...CAPITAL_WORKER_ROLES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: CAPITAL_FACTORY_CORE_IDENTITY.workerId,
  workerName: CAPITAL_FACTORY_CORE_IDENTITY.workerName,
  factory: CAPITAL_FACTORY_CORE_IDENTITY.factory,
  department: CAPITAL_FACTORY_CORE_IDENTITY.department,
  role: CAPITAL_FACTORY_CORE_IDENTITY.role,
  reportingLine: [...CAPITAL_FACTORY_CORE_IDENTITY.reportingLine],
  seedProjects: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPerformAccounting: true,
  neverForecastFinances: true,
  neverExecuteInvestmentsAutomatically: true,
  neverFabricateFinancialStatus: true,
  neverFabricateWorkerStatus: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ902OrLater: true,
  preserveCompleteTraceability: true,
  preserveFactoryAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildCapitalFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CapitalFactoryCoreConfiguration> = {},
): CapitalFactoryCoreConfiguration {
  let file: Partial<CapitalFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "capital-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CAPITAL_FACTORY_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.CAPITAL_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key: "capitalCategories" | "lifecycleStatuses" | "projectStatuses" | "workerRoles" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_CAPITAL_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_CAPITAL_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    capitalCategories: mergeList("capitalCategories"),
    lifecycleStatuses: mergeList("lifecycleStatuses"),
    projectStatuses: mergeList("projectStatuses"),
    workerRoles: mergeList("workerRoles"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CAPITAL_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedProjects: (overrides.seedProjects ?? file.seedProjects ?? []).map((p) => lockProject(p)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPerformAccounting: true,
    neverForecastFinances: true,
    neverExecuteInvestmentsAutomatically: true,
    neverFabricateFinancialStatus: true,
    neverFabricateWorkerStatus: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ902OrLater: true,
    preserveCompleteTraceability: true,
    preserveFactoryAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockProject(project: CapitalProject): CapitalProject {
  return {
    ...project,
    capitalProjectId: project.capitalProjectId || project.factoryProjectId,
    financialPeriod: project.financialPeriod || new Date().toISOString().slice(0, 7),
    capitalStatus: project.capitalStatus || "registered",
    capitalAllocationSummary: {
      ...(project.capitalAllocationSummary ?? {
        capitalBusinessId: project.capitalBusinessId,
        capitalCategory: String(project.capitalCategory),
        region: project.region,
        lifecycleStatus: String(project.lifecycleStatus),
        allocationNotes: [],
        fabricated: false as const,
        evidencePresent: true,
      }),
      allocationNotes: [...(project.capitalAllocationSummary?.allocationNotes ?? [])],
      fabricated: false,
    },
    workerStatusMatrix: project.workerStatusMatrix.map((entry) => ({ ...entry })),
    dependencyGraph: project.dependencyGraph.map((edge) => ({ ...edge })),
    outstandingTasks: [...project.outstandingTasks],
    risks: [...project.risks],
    traceabilityRefs: [...project.traceabilityRefs],
    metadata: { ...project.metadata },
    metadataVersion: project.metadataVersion || CAPFC_METADATA_VERSION,
    neverPerformAccounting: true,
    neverForecastFinances: true,
    neverExecuteInvestmentsAutomatically: true,
    neverFabricateFinancialStatus: true,
    neverFabricateWorkerStatus: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ902OrLater: true,
    preserveCompleteTraceability: true,
    preserveFactoryAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
