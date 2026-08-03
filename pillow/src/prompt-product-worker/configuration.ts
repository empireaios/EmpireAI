import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PPW_METADATA_VERSION,
  PRODUCT_TYPES,
  PROMPT_PRODUCT_WORKER_IDENTITY,
  TARGET_AI_PLATFORMS,
} from "./paths.js";
import type { PromptProductReport } from "./types.js";

export type PromptProductWorkerConfiguration = {
  enabled: boolean;
  promptRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultProductType: string;
  defaultTargetAiPlatform: string;
  supportedProductTypes: string[];
  supportedTargetAiPlatforms: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedPromptProducts: PromptProductReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-04 hard boundaries — force-locked true. */
  neverBuildSalesPages: true;
  neverProcessCustomerPayments: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ505OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalPromptProducts: true;
  preserveCompleteTraceability: true;
  validatePromptQuality: true;
  includeUserDocumentation: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PROMPT_PRODUCT_WORKER_CONFIGURATION: PromptProductWorkerConfiguration = {
  enabled: true,
  promptRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultProductType: "prompt_pack",
  defaultTargetAiPlatform: "multi_platform",
  supportedProductTypes: [...PRODUCT_TYPES],
  supportedTargetAiPlatforms: [...TARGET_AI_PLATFORMS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PROMPT_PRODUCT_WORKER_IDENTITY.workerId,
  workerName: PROMPT_PRODUCT_WORKER_IDENTITY.workerName,
  factory: PROMPT_PRODUCT_WORKER_IDENTITY.factory,
  department: PROMPT_PRODUCT_WORKER_IDENTITY.department,
  role: PROMPT_PRODUCT_WORKER_IDENTITY.role,
  reportingLine: [...PROMPT_PRODUCT_WORKER_IDENTITY.reportingLine],
  seedPromptProducts: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildSalesPages: true,
  neverProcessCustomerPayments: true,
  neverProcessPayments: true,
  neverDeliverProducts: true,
  neverPublishProductsDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ505OrLater: true,
  followApprovedProductResearch: true,
  followApprovedProductIntent: true,
  produceOriginalPromptProducts: true,
  preserveCompleteTraceability: true,
  validatePromptQuality: true,
  includeUserDocumentation: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildPromptProductWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PromptProductWorkerConfiguration> = {},
): PromptProductWorkerConfiguration {
  let file: Partial<PromptProductWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "prompt-product-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PROMPT_PRODUCT_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PROMPT_PRODUCT_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedProductTypes" | "supportedTargetAiPlatforms",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_PROMPT_PRODUCT_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_PROMPT_PRODUCT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedProductTypes: mergeList("supportedProductTypes"),
    supportedTargetAiPlatforms: mergeList("supportedTargetAiPlatforms"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PROMPT_PRODUCT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedPromptProducts: (overrides.seedPromptProducts ?? file.seedPromptProducts ?? []).map((p) =>
      lockPromptProduct(p),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildSalesPages: true,
    neverProcessCustomerPayments: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ505OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalPromptProducts: true,
    preserveCompleteTraceability: true,
    validatePromptQuality: true,
    includeUserDocumentation: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockPromptProduct(product: PromptProductReport): PromptProductReport {
  return {
    ...product,
    targetAiPlatforms: [...product.targetAiPlatforms],
    promptCategories: [...product.promptCategories],
    promptLibrary: product.promptLibrary.map((p) => ({
      ...p,
      variables: p.variables ? [...p.variables] : undefined,
      platformHints: p.platformHints ? [...p.platformHints] : undefined,
    })),
    workflowComponents: product.workflowComponents.map((w) => ({ ...w })),
    exportFormats: [...product.exportFormats],
    structuredPacks: product.structuredPacks.map((s) => ({
      ...s,
      promptIds: [...s.promptIds],
    })),
    promptArchitecture: product.promptArchitecture
      ? {
          ...product.promptArchitecture,
          layers: [...product.promptArchitecture.layers],
          categories: [...product.promptArchitecture.categories],
          designPrinciples: [...product.promptArchitecture.designPrinciples],
        }
      : null,
    selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...product.traceabilityRefs],
    preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: product.metadataVersion || PPW_METADATA_VERSION,
    neverBuildSalesPages: true,
    neverProcessCustomerPayments: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ505OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalPromptProducts: true,
    preserveCompleteTraceability: true,
    validatePromptQuality: true,
    includeUserDocumentation: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
