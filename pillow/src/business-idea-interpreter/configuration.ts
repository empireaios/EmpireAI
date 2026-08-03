import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BII_METADATA_VERSION, BUSINESS_TYPES, MISSING_INFORMATION_FIELDS } from "./paths.js";
import type { StructuredBusinessIntent } from "./types.js";

export type BusinessIdeaInterpreterConfiguration = {
  enabled: boolean;
  interpretationRulesEnabled: boolean;
  missingInformationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  businessTypes: string[];
  missingInformationFields: string[];
  minimumConfidenceScore: number;
  seedIntents: StructuredBusinessIntent[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-02 hard boundaries — force-locked true. */
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverBuildBusinesses: true;
  neverAssignWorkers: true;
  neverExecuteAnything: true;
  neverImplementQ203OrLater: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveOriginalCommandTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_BUSINESS_IDEA_INTERPRETER_CONFIGURATION: BusinessIdeaInterpreterConfiguration =
  {
    enabled: true,
    interpretationRulesEnabled: true,
    missingInformationRulesEnabled: true,
    validationRulesEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    missingInformationFields: [...MISSING_INFORMATION_FIELDS],
    minimumConfidenceScore: 0.35,
    seedIntents: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverGenerateBusinessModels: true,
    neverResearchMarkets: true,
    neverBuildBusinesses: true,
    neverAssignWorkers: true,
    neverExecuteAnything: true,
    neverImplementQ203OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOriginalCommandTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildBusinessIdeaInterpreterConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessIdeaInterpreterConfiguration> = {},
): BusinessIdeaInterpreterConfiguration {
  let file: Partial<BusinessIdeaInterpreterConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "business-idea-interpreter.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BUSINESS_IDEA_INTERPRETER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.BUSINESS_IDEA_INTERPRETER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const minConfidence = Number.parseFloat(
    process.env.BUSINESS_IDEA_INTERPRETER_MIN_CONFIDENCE ?? "",
  );

  const mergeList = (key: "businessTypes" | "missingInformationFields") =>
    Array.from(
      new Set([
        ...DEFAULT_BUSINESS_IDEA_INTERPRETER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_BUSINESS_IDEA_INTERPRETER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    missingInformationFields: mergeList("missingInformationFields"),
    seedIntents: (overrides.seedIntents ?? file.seedIntents ?? []).map((intent) => ({
      ...intent,
      constraints: [...intent.constraints],
      missingInformation: [...intent.missingInformation],
      metadataVersion: intent.metadataVersion || BII_METADATA_VERSION,
      preparedForLaterQ2Missions: true as const,
      neverGenerateBusinessModels: true as const,
      neverResearchMarkets: true as const,
      neverBuildBusinesses: true as const,
      neverAssignWorkers: true as const,
      neverExecuteAnything: true as const,
      neverImplementQ203OrLater: true as const,
      structuralSignalOnly: true as const,
      maskSensitiveValues: true as const,
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(minConfidence)
      ? { minimumConfidenceScore: Math.min(1, Math.max(0, minConfidence)) }
      : {}),
    neverGenerateBusinessModels: true,
    neverResearchMarkets: true,
    neverBuildBusinesses: true,
    neverAssignWorkers: true,
    neverExecuteAnything: true,
    neverImplementQ203OrLater: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveOriginalCommandTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
