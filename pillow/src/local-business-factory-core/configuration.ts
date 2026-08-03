import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  BUSINESS_CATEGORIES,
  CUSTOMER_ACQUISITION_STATUSES,
  LAUNCH_READINESS_STATUSES,
  LBFC_METADATA_VERSION,
  LIFECYCLE_STAGES,
  LOCAL_BUSINESS_FACTORY_CORE_IDENTITY,
  INTEGRATION_TARGETS,
  MISSION_STATUSES,
  OPERATIONAL_STATUSES,
} from "./paths.js";
import type { LocalBusinessProject } from "./types.js";

export type LocalBusinessFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  missionRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  missionCoordinationEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  businessCategories: string[];
  lifecycleStages: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  launchReadinessStatuses: string[];
  customerAcquisitionStatuses: string[];
  operationalStatuses: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedProjects: LocalBusinessProject[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-01 hard boundaries — force-locked true. */
  neverPerformSpecialistWorkerFunctions: true;
  neverReplaceQ7Workers: true;
  neverModifyUnrelatedFactories: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateOperationalStatus: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ702OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LOCAL_BUSINESS_FACTORY_CORE_CONFIGURATION: LocalBusinessFactoryCoreConfiguration =
  {
    enabled: true,
    validationRulesEnabled: true,
    missionRulesEnabled: true,
    lifecycleRulesEnabled: true,
    executiveReportingEnabled: true,
    missionCoordinationEnabled: true,
    requireGrandKingApproval: true,
    requirePillowCommandConfirmation: true,
    businessCategories: [...BUSINESS_CATEGORIES],
    lifecycleStages: [...LIFECYCLE_STAGES],
    missionStatuses: [...MISSION_STATUSES],
    approvalStatuses: [...APPROVAL_STATUSES],
    launchReadinessStatuses: [...LAUNCH_READINESS_STATUSES],
    customerAcquisitionStatuses: [...CUSTOMER_ACQUISITION_STATUSES],
    operationalStatuses: [...OPERATIONAL_STATUSES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.workerId,
    workerName: LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.workerName,
    factory: LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.factory,
    department: LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.department,
    role: LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.role,
    reportingLine: [...LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.reportingLine],
    seedProjects: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverPerformSpecialistWorkerFunctions: true,
    neverReplaceQ7Workers: true,
    neverModifyUnrelatedFactories: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateOperationalStatus: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ702OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildLocalBusinessFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalBusinessFactoryCoreConfiguration> = {},
): LocalBusinessFactoryCoreConfiguration {
  let file: Partial<LocalBusinessFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "local-business-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.LOCAL_BUSINESS_FACTORY_CORE_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.LOCAL_BUSINESS_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "businessCategories"
      | "lifecycleStages"
      | "missionStatuses"
      | "approvalStatuses"
      | "launchReadinessStatuses"
      | "customerAcquisitionStatuses"
      | "operationalStatuses"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_LOCAL_BUSINESS_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_LOCAL_BUSINESS_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    businessCategories: mergeList("businessCategories"),
    lifecycleStages: mergeList("lifecycleStages"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    launchReadinessStatuses: mergeList("launchReadinessStatuses"),
    customerAcquisitionStatuses: mergeList("customerAcquisitionStatuses"),
    operationalStatuses: mergeList("operationalStatuses"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LOCAL_BUSINESS_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedProjects: (overrides.seedProjects ?? file.seedProjects ?? []).map((p) =>
      lockProject(p),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPerformSpecialistWorkerFunctions: true,
    neverReplaceQ7Workers: true,
    neverModifyUnrelatedFactories: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateOperationalStatus: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ702OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockProject(project: LocalBusinessProject): LocalBusinessProject {
  return {
    ...project,
    assignedWorkers: [...project.assignedWorkers],
    assignedWorkerRoles: [...project.assignedWorkerRoles],
    outstandingIssues: [...project.outstandingIssues],
    preservedDecisions: [...project.preservedDecisions],
    traceabilityRefs: [...project.traceabilityRefs],
    metadataVersion: project.metadataVersion || LBFC_METADATA_VERSION,
    neverPerformSpecialistWorkerFunctions: true,
    neverReplaceQ7Workers: true,
    neverModifyUnrelatedFactories: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateOperationalStatus: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ702OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
