import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PEW_METADATA_VERSION,
  PRODUCT_EVALUATION_WORKER_IDENTITY,
  RECOMMENDATIONS,
  SCORE_DIMENSIONS,
} from "./paths.js";
import type { ProductEvaluationReport } from "./types.js";

export type ProductEvaluationWorkerConfiguration = {
  enabled: boolean;
  evaluationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  scoreDimensions: string[];
  recommendations: string[];
  proceedThreshold: number;
  reviewThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedEvaluations: ProductEvaluationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-03 hard boundaries — force-locked true. */
  neverDiscoverProducts: true;
  neverSelectSuppliers: true;
  neverCreateListings: true;
  neverPurchaseInventory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ304OrLater: true;
  baseEvaluationsOnEvidence: true;
  preserveDiscoveryTraceability: true;
  preserveAuditHistory: true;
  distinguishFactsFromAssumptions: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PRODUCT_EVALUATION_WORKER_CONFIGURATION: ProductEvaluationWorkerConfiguration =
  {
    enabled: true,
    evaluationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    scoreDimensions: [...SCORE_DIMENSIONS],
    recommendations: [...RECOMMENDATIONS],
    proceedThreshold: 70,
    reviewThreshold: 45,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: PRODUCT_EVALUATION_WORKER_IDENTITY.workerId,
    workerName: PRODUCT_EVALUATION_WORKER_IDENTITY.workerName,
    factory: PRODUCT_EVALUATION_WORKER_IDENTITY.factory,
    department: PRODUCT_EVALUATION_WORKER_IDENTITY.department,
    role: PRODUCT_EVALUATION_WORKER_IDENTITY.role,
    reportingLine: [...PRODUCT_EVALUATION_WORKER_IDENTITY.reportingLine],
    seedEvaluations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverDiscoverProducts: true,
    neverSelectSuppliers: true,
    neverCreateListings: true,
    neverPurchaseInventory: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ304OrLater: true,
    baseEvaluationsOnEvidence: true,
    preserveDiscoveryTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromAssumptions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildProductEvaluationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductEvaluationWorkerConfiguration> = {},
): ProductEvaluationWorkerConfiguration {
  let file: Partial<ProductEvaluationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "product-evaluation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRODUCT_EVALUATION_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.PRODUCT_EVALUATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "scoreDimensions" | "recommendations" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PRODUCT_EVALUATION_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PRODUCT_EVALUATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    scoreDimensions: mergeList("scoreDimensions"),
    recommendations: mergeList("recommendations"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRODUCT_EVALUATION_WORKER_CONFIGURATION.reportingLine),
    ],
    seedEvaluations: (overrides.seedEvaluations ?? file.seedEvaluations ?? []).map((e) =>
      lockEvaluation(e),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverDiscoverProducts: true,
    neverSelectSuppliers: true,
    neverCreateListings: true,
    neverPurchaseInventory: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ304OrLater: true,
    baseEvaluationsOnEvidence: true,
    preserveDiscoveryTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromAssumptions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockEvaluation(evaluation: ProductEvaluationReport): ProductEvaluationReport {
  return {
    ...evaluation,
    facts: [...evaluation.facts],
    assumptions: [...evaluation.assumptions],
    supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
    scoreNotes: { ...evaluation.scoreNotes },
    metadataVersion: evaluation.metadataVersion || PEW_METADATA_VERSION,
    neverDiscoverProducts: true,
    neverSelectSuppliers: true,
    neverCreateListings: true,
    neverPurchaseInventory: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ304OrLater: true,
    preserveDiscoveryTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
