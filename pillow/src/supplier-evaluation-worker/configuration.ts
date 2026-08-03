import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  RECOMMENDATIONS,
  SCORE_DIMENSIONS,
  SEW_METADATA_VERSION,
  SUPPLIER_EVALUATION_WORKER_IDENTITY,
} from "./paths.js";
import type { SupplierEvaluationReport } from "./types.js";

export type SupplierEvaluationWorkerConfiguration = {
  enabled: boolean;
  evaluationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  scoreDimensions: string[];
  recommendations: string[];
  approveThreshold: number;
  reviewThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedEvaluations: SupplierEvaluationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-05 hard boundaries — force-locked true. */
  neverDiscoverSuppliers: true;
  neverNegotiateSuppliers: true;
  neverPlaceSupplierOrders: true;
  neverModifySupplierInformation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ306OrLater: true;
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

export const DEFAULT_SUPPLIER_EVALUATION_WORKER_CONFIGURATION: SupplierEvaluationWorkerConfiguration =
  {
    enabled: true,
    evaluationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    scoreDimensions: [...SCORE_DIMENSIONS],
    recommendations: [...RECOMMENDATIONS],
    approveThreshold: 70,
    reviewThreshold: 45,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: SUPPLIER_EVALUATION_WORKER_IDENTITY.workerId,
    workerName: SUPPLIER_EVALUATION_WORKER_IDENTITY.workerName,
    factory: SUPPLIER_EVALUATION_WORKER_IDENTITY.factory,
    department: SUPPLIER_EVALUATION_WORKER_IDENTITY.department,
    role: SUPPLIER_EVALUATION_WORKER_IDENTITY.role,
    reportingLine: [...SUPPLIER_EVALUATION_WORKER_IDENTITY.reportingLine],
    seedEvaluations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverDiscoverSuppliers: true,
    neverNegotiateSuppliers: true,
    neverPlaceSupplierOrders: true,
    neverModifySupplierInformation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ306OrLater: true,
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

export function buildSupplierEvaluationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierEvaluationWorkerConfiguration> = {},
): SupplierEvaluationWorkerConfiguration {
  let file: Partial<SupplierEvaluationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "supplier-evaluation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SUPPLIER_EVALUATION_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.SUPPLIER_EVALUATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "scoreDimensions" | "recommendations" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_SUPPLIER_EVALUATION_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_SUPPLIER_EVALUATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    scoreDimensions: mergeList("scoreDimensions"),
    recommendations: mergeList("recommendations"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SUPPLIER_EVALUATION_WORKER_CONFIGURATION.reportingLine),
    ],
    seedEvaluations: (overrides.seedEvaluations ?? file.seedEvaluations ?? []).map((e) =>
      lockEvaluation(e),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverDiscoverSuppliers: true,
    neverNegotiateSuppliers: true,
    neverPlaceSupplierOrders: true,
    neverModifySupplierInformation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ306OrLater: true,
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

function lockEvaluation(evaluation: SupplierEvaluationReport): SupplierEvaluationReport {
  return {
    ...evaluation,
    facts: [...evaluation.facts],
    assumptions: [...evaluation.assumptions],
    supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
    scoreNotes: { ...evaluation.scoreNotes },
    metadataVersion: evaluation.metadataVersion || SEW_METADATA_VERSION,
    neverDiscoverSuppliers: true,
    neverNegotiateSuppliers: true,
    neverPlaceSupplierOrders: true,
    neverModifySupplierInformation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ306OrLater: true,
    preserveDiscoveryTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
