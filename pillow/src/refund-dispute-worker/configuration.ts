import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  RDW_METADATA_VERSION,
  REFUND_DISPUTE_WORKER_IDENTITY,
} from "./paths.js";
import type { RefundDisputeReport } from "./types.js";

export type PolicyRuleConfig = {
  policyId?: string;
  policyName?: string;
  decision?: "allow" | "deny" | "escalate" | "review";
  requireSupplierCoordination?: boolean;
  marketplaceRuleRefs?: string[];
};

export type RefundDisputeWorkerConfiguration = {
  enabled: boolean;
  caseRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  maxDelegatedRefundAmount: number;
  defaultReturnWindowDays: number;
  defaultPolicyId: string;
  policies: Record<string, PolicyRuleConfig>;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedCases: RefundDisputeReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-12 hard boundaries — force-locked true. */
  neverModifyFinancialLedgersDirectly: true;
  neverOverrideMarketplacePolicies: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ313OrLater: true;
  neverAuthorizeOutsideAuthorityMatrix: true;
  followApprovedPolicies: true;
  preserveCaseTraceability: true;
  preserveSupplierReferences: true;
  preserveCustomerCommunicationHistory: true;
  preserveAuditHistory: true;
  escalateBeyondDelegatedAuthority: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_REFUND_DISPUTE_WORKER_CONFIGURATION: RefundDisputeWorkerConfiguration =
  {
    enabled: true,
    caseRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    maxDelegatedRefundAmount: 100,
    defaultReturnWindowDays: 30,
    defaultPolicyId: "empireai-rdw-policy-v1",
    policies: {},
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: REFUND_DISPUTE_WORKER_IDENTITY.workerId,
    workerName: REFUND_DISPUTE_WORKER_IDENTITY.workerName,
    factory: REFUND_DISPUTE_WORKER_IDENTITY.factory,
    department: REFUND_DISPUTE_WORKER_IDENTITY.department,
    role: REFUND_DISPUTE_WORKER_IDENTITY.role,
    reportingLine: [...REFUND_DISPUTE_WORKER_IDENTITY.reportingLine],
    seedCases: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverModifyFinancialLedgersDirectly: true,
    neverOverrideMarketplacePolicies: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ313OrLater: true,
    neverAuthorizeOutsideAuthorityMatrix: true,
    followApprovedPolicies: true,
    preserveCaseTraceability: true,
    preserveSupplierReferences: true,
    preserveCustomerCommunicationHistory: true,
    preserveAuditHistory: true,
    escalateBeyondDelegatedAuthority: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildRefundDisputeWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RefundDisputeWorkerConfiguration> = {},
): RefundDisputeWorkerConfiguration {
  let file: Partial<RefundDisputeWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "refund-dispute-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.REFUND_DISPUTE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.REFUND_DISPUTE_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const maxAmount = Number.parseFloat(
    process.env.REFUND_DISPUTE_WORKER_MAX_DELEGATED_AMOUNT ?? "",
  );
  const returnWindow = Number.parseInt(
    process.env.REFUND_DISPUTE_WORKER_RETURN_WINDOW_DAYS ?? "",
    10,
  );

  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_REFUND_DISPUTE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_REFUND_DISPUTE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_REFUND_DISPUTE_WORKER_CONFIGURATION.reportingLine),
    ],
    policies: {
      ...DEFAULT_REFUND_DISPUTE_WORKER_CONFIGURATION.policies,
      ...(file.policies ?? {}),
      ...(overrides.policies ?? {}),
    },
    seedCases: (overrides.seedCases ?? file.seedCases ?? []).map((r) => lockReport(r)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxAmount) ? { maxDelegatedRefundAmount: maxAmount } : {}),
    ...(Number.isFinite(returnWindow) ? { defaultReturnWindowDays: returnWindow } : {}),
    neverModifyFinancialLedgersDirectly: true,
    neverOverrideMarketplacePolicies: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ313OrLater: true,
    neverAuthorizeOutsideAuthorityMatrix: true,
    followApprovedPolicies: true,
    preserveCaseTraceability: true,
    preserveSupplierReferences: true,
    preserveCustomerCommunicationHistory: true,
    preserveAuditHistory: true,
    escalateBeyondDelegatedAuthority: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: RefundDisputeReport): RefundDisputeReport {
  return {
    ...report,
    actionsTaken: report.actionsTaken.map((a) => ({ ...a })),
    customerCommunications: report.customerCommunications.map((c) => ({ ...c })),
    escalations: report.escalations.map((e) => ({ ...e })),
    supplierCoordination: report.supplierCoordination.map((s) => ({ ...s })),
    caseHistory: report.caseHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    policyEvaluation: {
      ...report.policyEvaluation,
      marketplaceRuleRefs: [...report.policyEvaluation.marketplaceRuleRefs],
    },
    resolution: { ...report.resolution },
    metadataVersion: report.metadataVersion || RDW_METADATA_VERSION,
    neverModifyFinancialLedgersDirectly: true,
    neverOverrideMarketplacePolicies: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ313OrLater: true,
    neverAuthorizeOutsideAuthorityMatrix: true,
    followApprovedPolicies: true,
    preserveCaseTraceability: true,
    preserveSupplierReferences: true,
    preserveCustomerCommunicationHistory: true,
    preserveAuditHistory: true,
    escalateBeyondDelegatedAuthority: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
