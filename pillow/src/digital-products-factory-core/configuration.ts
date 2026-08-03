import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYTICS_STATUSES,
  APPROVAL_STATUSES,
  DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY,
  DPF_METADATA_VERSION,
  FULFILMENT_STATUSES,
  INTEGRATION_TARGETS,
  LEARNING_STATUSES,
  MISSION_STATUSES,
  PIPELINE_STAGES,
  PIPELINE_TYPES,
  PRODUCTION_STATUSES,
  PRODUCT_TYPES,
} from "./paths.js";
import type { DigitalProductBusinessMission } from "./types.js";

export type DigitalProductsFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  missionRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  missionCoordinationEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  productTypes: string[];
  pipelineTypes: string[];
  pipelineStages: string[];
  contentStages: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  fulfilmentStatuses: string[];
  analyticsStatuses: string[];
  learningStatuses: string[];
  productionStatuses: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedMissions: DigitalProductBusinessMission[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-01 hard boundaries — force-locked true. */
  neverCreateEbooks: true;
  neverCreateCourses: true;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ502OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DIGITAL_PRODUCTS_FACTORY_CORE_CONFIGURATION: DigitalProductsFactoryCoreConfiguration =
  {
    enabled: true,
    validationRulesEnabled: true,
    missionRulesEnabled: true,
    lifecycleRulesEnabled: true,
    executiveReportingEnabled: true,
    missionCoordinationEnabled: true,
    requireGrandKingApproval: true,
    requirePillowCommandConfirmation: true,
    productTypes: [...PRODUCT_TYPES],
    pipelineTypes: [...PIPELINE_TYPES],
    pipelineStages: [...PIPELINE_STAGES],
    contentStages: [...PIPELINE_STAGES],
    missionStatuses: [...MISSION_STATUSES],
    approvalStatuses: [...APPROVAL_STATUSES],
    fulfilmentStatuses: [...FULFILMENT_STATUSES],
    analyticsStatuses: [...ANALYTICS_STATUSES],
    learningStatuses: [...LEARNING_STATUSES],
    productionStatuses: [...PRODUCTION_STATUSES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.workerId,
    workerName: DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.workerName,
    factory: DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.factory,
    department: DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.department,
    role: DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.role,
    reportingLine: [...DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.reportingLine],
    seedMissions: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverCreateEbooks: true,
    neverCreateCourses: true,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverBypassApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ502OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildDigitalProductsFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DigitalProductsFactoryCoreConfiguration> = {},
): DigitalProductsFactoryCoreConfiguration {
  let file: Partial<DigitalProductsFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "digital-products-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.DIGITAL_PRODUCTS_FACTORY_CORE_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.DIGITAL_PRODUCTS_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "productTypes"
      | "pipelineTypes"
      | "pipelineStages"
      | "contentStages"
      | "missionStatuses"
      | "approvalStatuses"
      | "fulfilmentStatuses"
      | "analyticsStatuses"
      | "learningStatuses"
      | "productionStatuses"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_DIGITAL_PRODUCTS_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_DIGITAL_PRODUCTS_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    productTypes: mergeList("productTypes"),
    pipelineTypes: mergeList("pipelineTypes"),
    pipelineStages: mergeList("pipelineStages"),
    contentStages: mergeList("contentStages"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    fulfilmentStatuses: mergeList("fulfilmentStatuses"),
    analyticsStatuses: mergeList("analyticsStatuses"),
    learningStatuses: mergeList("learningStatuses"),
    productionStatuses: mergeList("productionStatuses"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_DIGITAL_PRODUCTS_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((m) =>
      lockMission(m),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverCreateEbooks: true,
    neverCreateCourses: true,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverBypassApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ502OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockMission(
  mission: DigitalProductBusinessMission,
): DigitalProductBusinessMission {
  return {
    ...mission,
    productPortfolio: [...mission.productPortfolio],
    activeProducts: [...mission.activeProducts],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
    metadataVersion: mission.metadataVersion || DPF_METADATA_VERSION,
    neverCreateEbooks: true,
    neverCreateCourses: true,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverBypassApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ502OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
