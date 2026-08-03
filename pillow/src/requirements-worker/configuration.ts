import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REQUIREMENTS_WORKER_IDENTITY,
  REQUIREMENT_TYPES,
  RQW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { RequirementsReport } from "./types.js";

export type RequirementsWorkerConfiguration = {
  enabled: boolean;
  requirementsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultRequirementType: string;
  supportedRequirementTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedRequirementsReports: RequirementsReport[];
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q6-02 hard boundaries — force-locked true. */
  neverDesignArchitecture: true;
  neverWriteApplicationCode: true;
  neverDeploySoftware: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedBusinessRequirements: true;
  neverImplementQ603OrLater: true;
  followApprovedBusinessIntent: true;
  preserveCompleteTraceability: true;
  distinguishRequirementsFromAssumptions: true;
  validateCompletenessBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverBypassPillowGovernance: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_REQUIREMENTS_WORKER_CONFIGURATION: RequirementsWorkerConfiguration = {
  enabled: true,
  requirementsRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultRequirementType: "functional_requirements",
  supportedRequirementTypes: [...REQUIREMENT_TYPES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: REQUIREMENTS_WORKER_IDENTITY.workerId,
  workerName: REQUIREMENTS_WORKER_IDENTITY.workerName,
  factory: REQUIREMENTS_WORKER_IDENTITY.factory,
  department: REQUIREMENTS_WORKER_IDENTITY.department,
  role: REQUIREMENTS_WORKER_IDENTITY.role,
  reportingLine: [...REQUIREMENTS_WORKER_IDENTITY.reportingLine],
  seedRequirementsReports: [],
  timeoutMs: 5000,
  loggingLevel: "info",
  neverDesignArchitecture: true,
  neverWriteApplicationCode: true,
  neverDeploySoftware: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverInventUnsupportedBusinessRequirements: true,
  neverImplementQ603OrLater: true,
  followApprovedBusinessIntent: true,
  preserveCompleteTraceability: true,
  distinguishRequirementsFromAssumptions: true,
  validateCompletenessBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverBypassPillowGovernance: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildRequirementsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RequirementsWorkerConfiguration> = {},
): RequirementsWorkerConfiguration {
  let file: Partial<RequirementsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "requirements-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.REQUIREMENTS_WORKER_TIMEOUT_MS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedRequirementTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_REQUIREMENTS_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_REQUIREMENTS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedRequirementTypes: mergeList("supportedRequirementTypes"),
    defaultRequirementType:
      overrides.defaultRequirementType ??
      file.defaultRequirementType ??
      DEFAULT_REQUIREMENTS_WORKER_CONFIGURATION.defaultRequirementType,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_REQUIREMENTS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedRequirementsReports: (overrides.seedRequirementsReports ?? file.seedRequirementsReports ?? []).map(
      (r) => lockRequirementsReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    neverDesignArchitecture: true,
    neverWriteApplicationCode: true,
    neverDeploySoftware: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverInventUnsupportedBusinessRequirements: true,
    neverImplementQ603OrLater: true,
    followApprovedBusinessIntent: true,
    preserveCompleteTraceability: true,
    distinguishRequirementsFromAssumptions: true,
    validateCompletenessBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverBypassPillowGovernance: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockRequirementsReport(report: RequirementsReport): RequirementsReport {
  return {
    ...report,
    requirementsSteps: report.requirementsSteps.map((s) => ({ ...s })),
    supportedRequirementTypes: [...report.supportedRequirementTypes],
    functionalRequirements: report.functionalRequirements.map((r) => ({ ...r })),
    nonFunctionalRequirements: report.nonFunctionalRequirements.map((r) => ({ ...r })),
    userStories: report.userStories.map((s) => ({ ...s })),
    useCases: report.useCases.map((u) => ({ ...u })),
    acceptanceCriteria: report.acceptanceCriteria.map((a) => ({ ...a })),
    assumptions: [...report.assumptions],
    constraints: [...report.constraints],
    technicalConstraints: [...report.technicalConstraints],
    regulatoryConstraints: [...report.regulatoryConstraints],
    risks: report.risks.map((r) => ({ ...r })),
    businessRules: report.businessRules.map((b) => ({ ...b })),
    stakeholders: [...report.stakeholders],
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || RQW_METADATA_VERSION,
    neverDesignArchitecture: true,
    neverWriteApplicationCode: true,
    neverDeploySoftware: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverInventUnsupportedBusinessRequirements: true,
    neverImplementQ603OrLater: true,
    followApprovedBusinessIntent: true,
    preserveCompleteTraceability: true,
    distinguishRequirementsFromAssumptions: true,
    validateCompletenessBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
