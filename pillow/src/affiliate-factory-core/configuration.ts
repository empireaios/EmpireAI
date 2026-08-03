import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AFC_METADATA_VERSION,
  AFFILIATE_FACTORY_CORE_IDENTITY,
  AFFILIATE_NICHES,
  AFFILIATE_WORKER_ROLES,
  INTEGRATION_TARGETS,
  LIFECYCLE_STATUSES,
  PROJECT_STATUSES,
} from "./paths.js";
import type { AffiliateBusinessProject } from "./types.js";

export type AffiliateFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  projectRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  affiliateNiches: string[];
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
  seedProjects: AffiliateBusinessProject[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q8-01 hard boundaries — force-locked true. */
  neverDiscoverAffiliateProgrammes: true;
  neverGenerateAffiliateContent: true;
  neverLaunchBusinessesAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ802OrLater: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_AFFILIATE_FACTORY_CORE_CONFIGURATION: AffiliateFactoryCoreConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  projectRulesEnabled: true,
  lifecycleRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  affiliateNiches: [...AFFILIATE_NICHES],
  lifecycleStatuses: [...LIFECYCLE_STATUSES],
  projectStatuses: [...PROJECT_STATUSES],
  workerRoles: [...AFFILIATE_WORKER_ROLES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: AFFILIATE_FACTORY_CORE_IDENTITY.workerId,
  workerName: AFFILIATE_FACTORY_CORE_IDENTITY.workerName,
  factory: AFFILIATE_FACTORY_CORE_IDENTITY.factory,
  department: AFFILIATE_FACTORY_CORE_IDENTITY.department,
  role: AFFILIATE_FACTORY_CORE_IDENTITY.role,
  reportingLine: [...AFFILIATE_FACTORY_CORE_IDENTITY.reportingLine],
  seedProjects: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverDiscoverAffiliateProgrammes: true,
  neverGenerateAffiliateContent: true,
  neverLaunchBusinessesAutomatically: true,
  neverFabricateWorkerStatus: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ802OrLater: true,
  preserveCompleteTraceability: true,
  preserveFactoryAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildAffiliateFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AffiliateFactoryCoreConfiguration> = {},
): AffiliateFactoryCoreConfiguration {
  let file: Partial<AffiliateFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "affiliate-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.AFFILIATE_FACTORY_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.AFFILIATE_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key: "affiliateNiches" | "lifecycleStatuses" | "projectStatuses" | "workerRoles" | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_AFFILIATE_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_AFFILIATE_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    affiliateNiches: mergeList("affiliateNiches"),
    lifecycleStatuses: mergeList("lifecycleStatuses"),
    projectStatuses: mergeList("projectStatuses"),
    workerRoles: mergeList("workerRoles"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_AFFILIATE_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedProjects: (overrides.seedProjects ?? file.seedProjects ?? []).map((p) => lockProject(p)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverDiscoverAffiliateProgrammes: true,
    neverGenerateAffiliateContent: true,
    neverLaunchBusinessesAutomatically: true,
    neverFabricateWorkerStatus: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ802OrLater: true,
    preserveCompleteTraceability: true,
    preserveFactoryAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockProject(project: AffiliateBusinessProject): AffiliateBusinessProject {
  return {
    ...project,
    workerStatusMatrix: project.workerStatusMatrix.map((entry) => ({ ...entry })),
    dependencyGraph: project.dependencyGraph.map((edge) => ({ ...edge })),
    outstandingTasks: [...project.outstandingTasks],
    risks: [...project.risks],
    traceabilityRefs: [...project.traceabilityRefs],
    metadata: { ...project.metadata },
    metadataVersion: project.metadataVersion || AFC_METADATA_VERSION,
    neverDiscoverAffiliateProgrammes: true,
    neverGenerateAffiliateContent: true,
    neverLaunchBusinessesAutomatically: true,
    neverFabricateWorkerStatus: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ802OrLater: true,
    preserveCompleteTraceability: true,
    preserveFactoryAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
