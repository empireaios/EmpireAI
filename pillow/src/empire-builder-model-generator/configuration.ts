import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_MODEL_TYPES,
  BUSINESS_TYPES,
  EMG_METADATA_VERSION,
} from "./paths.js";
import type { EmpireBuilderBusinessModel } from "./types.js";

export type EmpireBuilderModelGeneratorConfiguration = {
  enabled: boolean;
  generationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  businessTypes: string[];
  businessModelTypes: string[];
  seedModels: EmpireBuilderBusinessModel[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-03 hard boundaries — force-locked true. */
  neverValidateDemand: true;
  neverPerformMarketResearch: true;
  neverBuildBranding: true;
  neverAssignWorkers: true;
  neverLaunchBusiness: true;
  neverImplementQ204OrLater: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveIntentTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EMPIRE_BUILDER_MODEL_GENERATOR_CONFIGURATION: EmpireBuilderModelGeneratorConfiguration =
  {
    enabled: true,
    generationRulesEnabled: true,
    validationRulesEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    businessModelTypes: [...BUSINESS_MODEL_TYPES],
    seedModels: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverValidateDemand: true,
    neverPerformMarketResearch: true,
    neverBuildBranding: true,
    neverAssignWorkers: true,
    neverLaunchBusiness: true,
    neverImplementQ204OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveIntentTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildEmpireBuilderModelGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmpireBuilderModelGeneratorConfiguration> = {},
): EmpireBuilderModelGeneratorConfiguration {
  let file: Partial<EmpireBuilderModelGeneratorConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "empire-builder-model-generator.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.EMPIRE_BUILDER_MODEL_GENERATOR_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.EMPIRE_BUILDER_MODEL_GENERATOR_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "businessTypes" | "businessModelTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_EMPIRE_BUILDER_MODEL_GENERATOR_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_EMPIRE_BUILDER_MODEL_GENERATOR_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    businessModelTypes: mergeList("businessModelTypes"),
    seedModels: (overrides.seedModels ?? file.seedModels ?? []).map((model) => ({
      ...model,
      productsServices: [...model.productsServices],
      customerSegments: [...model.customerSegments],
      requiredCapabilities: [...model.requiredCapabilities],
      requiredIntegrations: [...model.requiredIntegrations],
      businessAssumptions: [...model.businessAssumptions],
      metadataVersion: model.metadataVersion || EMG_METADATA_VERSION,
      preparedForDownstreamPlanning: true as const,
      neverValidateDemand: true as const,
      neverPerformMarketResearch: true as const,
      neverBuildBranding: true as const,
      neverAssignWorkers: true as const,
      neverLaunchBusiness: true as const,
      neverImplementQ204OrLater: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverValidateDemand: true,
    neverPerformMarketResearch: true,
    neverBuildBranding: true,
    neverAssignWorkers: true,
    neverLaunchBusiness: true,
    neverImplementQ204OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveIntentTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
