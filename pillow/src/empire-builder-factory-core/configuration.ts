import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  BUSINESS_TYPES,
  EBF_METADATA_VERSION,
  MISSION_STATUSES,
  REQUIRED_NEXT_STEPS,
} from "./paths.js";
import type { BusinessBuildMissionRecord } from "./types.js";

export type EmpireBuilderFactoryCoreConfiguration = {
  enabled: boolean;
  acceptanceRulesEnabled: boolean;
  classificationRulesEnabled: boolean;
  preparationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  businessTypes: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  requiredNextSteps: string[];
  defaultApprovalStatus: string;
  defaultMissionStatus: string;
  seedMissions: BusinessBuildMissionRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-01 hard boundaries — force-locked true. */
  neverInterpretDetailedBusinessStrategy: true;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverAssignWorkers: true;
  neverExecuteBusinesses: true;
  neverLaunchBusinesses: true;
  neverImplementQ202OrLater: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EMPIRE_BUILDER_FACTORY_CORE_CONFIGURATION: EmpireBuilderFactoryCoreConfiguration =
  {
    enabled: true,
    acceptanceRulesEnabled: true,
    classificationRulesEnabled: true,
    preparationRulesEnabled: true,
    validationRulesEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    missionStatuses: [...MISSION_STATUSES],
    approvalStatuses: [...APPROVAL_STATUSES],
    requiredNextSteps: [...REQUIRED_NEXT_STEPS],
    defaultApprovalStatus: "pending_pillow_review",
    defaultMissionStatus: "prepared",
    seedMissions: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverInterpretDetailedBusinessStrategy: true,
    neverGenerateBusinessModels: true,
    neverResearchMarkets: true,
    neverAssignWorkers: true,
    neverExecuteBusinesses: true,
    neverLaunchBusinesses: true,
    neverImplementQ202OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildEmpireBuilderFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmpireBuilderFactoryCoreConfiguration> = {},
): EmpireBuilderFactoryCoreConfiguration {
  let file: Partial<EmpireBuilderFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "empire-builder-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.EMPIRE_BUILDER_FACTORY_CORE_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.EMPIRE_BUILDER_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key: "businessTypes" | "missionStatuses" | "approvalStatuses" | "requiredNextSteps",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_EMPIRE_BUILDER_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_EMPIRE_BUILDER_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    requiredNextSteps: mergeList("requiredNextSteps"),
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((m) => ({
      ...m,
      metadataVersion: m.metadataVersion || EBF_METADATA_VERSION,
      preparedForQ2Workers: true as const,
      neverInterpretDetailedBusinessStrategy: true as const,
      neverGenerateBusinessModels: true as const,
      neverResearchMarkets: true as const,
      neverAssignWorkers: true as const,
      neverExecuteBusinesses: true as const,
      neverLaunchBusinesses: true as const,
      neverImplementQ202OrLater: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverInterpretDetailedBusinessStrategy: true,
    neverGenerateBusinessModels: true,
    neverResearchMarkets: true,
    neverAssignWorkers: true,
    neverExecuteBusinesses: true,
    neverLaunchBusinesses: true,
    neverImplementQ202OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
