import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BBW_METADATA_VERSION,
  BUSINESS_BLUEPRINT_WORKER_IDENTITY,
  BUSINESS_TYPES,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { BusinessBlueprint } from "./types.js";

export type BusinessBlueprintWorkerConfiguration = {
  enabled: boolean;
  blueprintRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireProceedRecommendation: boolean;
  businessTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedBlueprints: BusinessBlueprint[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-06 hard boundaries — force-locked true. */
  neverExecuteBusiness: true;
  neverLaunchProducts: true;
  neverCreateBranding: true;
  neverBuildWebsites: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ207OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  produceSingleCanonicalBlueprint: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_BUSINESS_BLUEPRINT_WORKER_CONFIGURATION: BusinessBlueprintWorkerConfiguration =
  {
    enabled: true,
    blueprintRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    requireProceedRecommendation: true,
    businessTypes: [...BUSINESS_TYPES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: BUSINESS_BLUEPRINT_WORKER_IDENTITY.workerId,
    workerName: BUSINESS_BLUEPRINT_WORKER_IDENTITY.workerName,
    factory: BUSINESS_BLUEPRINT_WORKER_IDENTITY.factory,
    department: BUSINESS_BLUEPRINT_WORKER_IDENTITY.department,
    role: BUSINESS_BLUEPRINT_WORKER_IDENTITY.role,
    reportingLine: [...BUSINESS_BLUEPRINT_WORKER_IDENTITY.reportingLine],
    seedBlueprints: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteBusiness: true,
    neverLaunchProducts: true,
    neverCreateBranding: true,
    neverBuildWebsites: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ207OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    produceSingleCanonicalBlueprint: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildBusinessBlueprintWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessBlueprintWorkerConfiguration> = {},
): BusinessBlueprintWorkerConfiguration {
  let file: Partial<BusinessBlueprintWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "business-blueprint-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.BUSINESS_BLUEPRINT_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.BUSINESS_BLUEPRINT_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "businessTypes" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_BUSINESS_BLUEPRINT_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_BUSINESS_BLUEPRINT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BUSINESS_BLUEPRINT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedBlueprints: (overrides.seedBlueprints ?? file.seedBlueprints ?? []).map((b) =>
      lockBlueprint(b),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteBusiness: true,
    neverLaunchProducts: true,
    neverCreateBranding: true,
    neverBuildWebsites: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ207OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    produceSingleCanonicalBlueprint: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockBlueprint(blueprint: BusinessBlueprint): BusinessBlueprint {
  return {
    ...blueprint,
    productsServices: [...blueprint.productsServices],
    customerSegments: [...blueprint.customerSegments],
    requiredIntegrations: [...blueprint.requiredIntegrations],
    requiredAssets: [...blueprint.requiredAssets],
    preservedDecisions: [...blueprint.preservedDecisions],
    traceabilityRefs: [...blueprint.traceabilityRefs],
    operationalWorkflow: blueprint.operationalWorkflow.map((s) => ({
      ...s,
      dependsOn: [...s.dependsOn],
    })),
    requiredWorkers: blueprint.requiredWorkers.map((w) => ({
      ...w,
      skills: [...w.skills],
    })),
    milestones: blueprint.milestones.map((m) => ({
      ...m,
      dependsOn: [...m.dependsOn],
      successCriteria: [...m.successCriteria],
    })),
    dependencies: blueprint.dependencies.map((d) => ({
      ...d,
      blocks: [...d.blocks],
    })),
    businessArchitecture: {
      ...blueprint.businessArchitecture,
      deliveryChannels: [...blueprint.businessArchitecture.deliveryChannels],
      customerProblemsAddressed: [
        ...blueprint.businessArchitecture.customerProblemsAddressed,
      ],
    },
    metadataVersion: blueprint.metadataVersion || BBW_METADATA_VERSION,
    neverExecuteBusiness: true,
    neverLaunchProducts: true,
    neverCreateBranding: true,
    neverBuildWebsites: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    canonicalBlueprint: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
