import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  BUSINESS_TYPES,
  CMF_METADATA_VERSION,
  COMMERCE_CATEGORIES,
  COMMERCE_FACTORY_CORE_IDENTITY,
  INTEGRATION_TARGETS,
  MISSION_STATUSES,
  REQUIRED_NEXT_STEPS,
} from "./paths.js";
import type { CommerceBuildMission } from "./types.js";

export type CommerceFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  missionRulesEnabled: boolean;
  classificationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  missionCoordinationEnabled: boolean;
  requireGrandKingApproval: boolean;
  requireProceedRecommendation: boolean;
  businessTypes: string[];
  commerceCategories: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  requiredNextSteps: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedMissions: CommerceBuildMission[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-01 hard boundaries — force-locked true. */
  neverBuildStores: true;
  neverImportProducts: true;
  neverConfigureMarketplaces: true;
  neverExecuteCommerceImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ302OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_COMMERCE_FACTORY_CORE_CONFIGURATION: CommerceFactoryCoreConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  missionRulesEnabled: true,
  classificationRulesEnabled: true,
  executiveReportingEnabled: true,
  missionCoordinationEnabled: true,
  requireGrandKingApproval: true,
  requireProceedRecommendation: true,
  businessTypes: [...BUSINESS_TYPES],
  commerceCategories: [...COMMERCE_CATEGORIES],
  missionStatuses: [...MISSION_STATUSES],
  approvalStatuses: [...APPROVAL_STATUSES],
  requiredNextSteps: [...REQUIRED_NEXT_STEPS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: COMMERCE_FACTORY_CORE_IDENTITY.workerId,
  workerName: COMMERCE_FACTORY_CORE_IDENTITY.workerName,
  factory: COMMERCE_FACTORY_CORE_IDENTITY.factory,
  department: COMMERCE_FACTORY_CORE_IDENTITY.department,
  role: COMMERCE_FACTORY_CORE_IDENTITY.role,
  reportingLine: [...COMMERCE_FACTORY_CORE_IDENTITY.reportingLine],
  seedMissions: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildStores: true,
  neverImportProducts: true,
  neverConfigureMarketplaces: true,
  neverExecuteCommerceImplementation: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ302OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildCommerceFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CommerceFactoryCoreConfiguration> = {},
): CommerceFactoryCoreConfiguration {
  let file: Partial<CommerceFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "commerce-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.COMMERCE_FACTORY_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.COMMERCE_FACTORY_CORE_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key:
      | "businessTypes"
      | "commerceCategories"
      | "missionStatuses"
      | "approvalStatuses"
      | "requiredNextSteps"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_COMMERCE_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_COMMERCE_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    commerceCategories: mergeList("commerceCategories"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    requiredNextSteps: mergeList("requiredNextSteps"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_COMMERCE_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((m) => lockMission(m)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildStores: true,
    neverImportProducts: true,
    neverConfigureMarketplaces: true,
    neverExecuteCommerceImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ302OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockMission(mission: CommerceBuildMission): CommerceBuildMission {
  return {
    ...mission,
    missingPrerequisites: [...mission.missingPrerequisites],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
    metadataVersion: mission.metadataVersion || CMF_METADATA_VERSION,
    neverBuildStores: true,
    neverImportProducts: true,
    neverConfigureMarketplaces: true,
    neverExecuteCommerceImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ302OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
