import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  RECOMMENDATIONS,
  SNW_METADATA_VERSION,
  SUPPLIER_NEGOTIATION_WORKER_IDENTITY,
} from "./paths.js";
import type { SupplierNegotiationReport } from "./types.js";

export type SupplierNegotiationWorkerConfiguration = {
  enabled: boolean;
  negotiationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  recommendations: string[];
  preferThreshold: number;
  reviewThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedNegotiations: SupplierNegotiationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-06 hard boundaries — force-locked true. */
  neverContactSuppliers: true;
  neverCommitAgreements: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ307OrLater: true;
  preserveSupplierTraceability: true;
  baseOnEvaluationResults: true;
  produceProfessionalCommunication: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SUPPLIER_NEGOTIATION_WORKER_CONFIGURATION: SupplierNegotiationWorkerConfiguration =
  {
    enabled: true,
    negotiationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    recommendations: [...RECOMMENDATIONS],
    preferThreshold: 70,
    reviewThreshold: 45,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.workerId,
    workerName: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.workerName,
    factory: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.factory,
    department: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.department,
    role: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.role,
    reportingLine: [...SUPPLIER_NEGOTIATION_WORKER_IDENTITY.reportingLine],
    seedNegotiations: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverContactSuppliers: true,
    neverCommitAgreements: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ307OrLater: true,
    preserveSupplierTraceability: true,
    baseOnEvaluationResults: true,
    produceProfessionalCommunication: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildSupplierNegotiationWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierNegotiationWorkerConfiguration> = {},
): SupplierNegotiationWorkerConfiguration {
  let file: Partial<SupplierNegotiationWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "supplier-negotiation-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SUPPLIER_NEGOTIATION_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.SUPPLIER_NEGOTIATION_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "recommendations" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_SUPPLIER_NEGOTIATION_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_SUPPLIER_NEGOTIATION_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    recommendations: mergeList("recommendations"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SUPPLIER_NEGOTIATION_WORKER_CONFIGURATION.reportingLine),
    ],
    seedNegotiations: (overrides.seedNegotiations ?? file.seedNegotiations ?? []).map((n) =>
      lockNegotiation(n),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverContactSuppliers: true,
    neverCommitAgreements: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ307OrLater: true,
    preserveSupplierTraceability: true,
    baseOnEvaluationResults: true,
    produceProfessionalCommunication: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockNegotiation(negotiation: SupplierNegotiationReport): SupplierNegotiationReport {
  return {
    ...negotiation,
    candidateSuppliers: negotiation.candidateSuppliers.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    preferredSupplier: negotiation.preferredSupplier
      ? {
          ...negotiation.preferredSupplier,
          strengths: [...negotiation.preferredSupplier.strengths],
          weaknesses: [...negotiation.preferredSupplier.weaknesses],
        }
      : null,
    negotiationOpportunities: [...negotiation.negotiationOpportunities],
    moqNegotiation: cloneTopic(negotiation.moqNegotiation),
    priceNegotiation: cloneTopic(negotiation.priceNegotiation),
    shippingNegotiation: cloneTopic(negotiation.shippingNegotiation),
    fulfilmentQuestions: cloneTopic(negotiation.fulfilmentQuestions),
    refundQuestions: cloneTopic(negotiation.refundQuestions),
    supportingEvidence: negotiation.supportingEvidence.map((e) => ({ ...e })),
    evaluationIds: [...negotiation.evaluationIds],
    metadataVersion: negotiation.metadataVersion || SNW_METADATA_VERSION,
    neverContactSuppliers: true,
    neverCommitAgreements: true,
    neverPlaceOrders: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ307OrLater: true,
    preserveSupplierTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function cloneTopic(topic: SupplierNegotiationReport["moqNegotiation"]) {
  return {
    ...topic,
    opportunities: [...topic.opportunities],
    questions: [...topic.questions],
  };
}
