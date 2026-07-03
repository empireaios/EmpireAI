/**
 * G7-05 — Grand King financial operations contract types.
 */

import { z } from "zod";
import type {
  FinancialDomainId,
  FinancialStatus,
  FinancialTransactionType,
  ReconciliationStatus,
} from "../../../registry/types/financial-operations-registry-types.js";
import {
  FINANCIAL_DOMAIN_IDS,
  FINANCIAL_STATUSES,
  FINANCIAL_TRANSACTION_TYPES,
  FINANCIAL_OPERATIONS_REGISTRY_VERSION,
  RECONCILIATION_STATUSES,
} from "../../../registry/types/financial-operations-registry-types.js";

export const GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION = "g7-05-v1" as const;

export {
  FINANCIAL_DOMAIN_IDS,
  FINANCIAL_STATUSES,
  FINANCIAL_TRANSACTION_TYPES,
  FINANCIAL_OPERATIONS_REGISTRY_VERSION,
  RECONCILIATION_STATUSES,
};
export type { FinancialDomainId, FinancialStatus, FinancialTransactionType, ReconciliationStatus };

export const FINANCIAL_EKLS_KINDS = [
  "financial_record_created",
  "financial_reconciled",
  "profitability_updated",
  "financial_anomaly_detected",
  "financial_learning_recorded",
] as const;

export type FinancialEklsKind = (typeof FINANCIAL_EKLS_KINDS)[number];

export type FinancialEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "redacted" | "aggregate";
  summary: string;
  ref?: string;
};

/** G7-05 — Every financial record conforms to this contract. */
export type FinancialRecord = {
  financialRecordId: string;
  workspaceId: string;
  brandId: string;
  providerId: string;
  transactionType: FinancialTransactionType;
  currency: string;
  grossAmount: number;
  fees: number;
  refundAmount: number;
  taxAmount: number;
  netAmount: number;
  status: FinancialStatus;
  reconciliationStatus: ReconciliationStatus;
  evidence: FinancialEvidence[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
  domainId: FinancialDomainId;
};

export type FinancialKpiSnapshot = {
  grossRevenue: number;
  netRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  subscriptionMrr: number;
  advertisingRoi: number;
  refundRate: number;
  chargebackRate: number;
  cashAvailable: number;
  outstandingPayouts: number;
  operationalExpenses: number;
  currency: string;
  computedAt: string;
  policyReference: string;
};

export type FinancialOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION;
  domainCount: number;
  recordCount: number;
  reconciledCount: number;
  pendingReviewCount: number;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export type ProfitabilityReport = {
  grossRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  projectedProfit: number;
  currency: string;
  computedAt: string;
};

export type CashPositionSummary = {
  cashAvailable: number;
  outstandingPayouts: number;
  pendingReceivables: number;
  currency: string;
  computedAt: string;
};

export type PayoutStatusSummary = {
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  payouts: Array<{ payoutId: string; providerId: string; amount: number; status: FinancialStatus }>;
};

export type SubscriptionMetricsSummary = {
  mrr: number;
  activeSubscriptions: number;
  churnRate: number;
  currency: string;
};

export type AdvertisingRoiSummary = {
  totalSpend: number;
  attributedRevenue: number;
  roi: number;
  currency: string;
};

export type FinancialRiskEntry = {
  riskId: string;
  domainId: FinancialDomainId;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  anomalyRef: string;
};

export type FinancialRiskRegister = {
  riskCount: number;
  risks: FinancialRiskEntry[];
};

export const financialOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "payment_provider",
    "financial_provider",
    "ledger_provider",
    "roi_analyser",
    "financial_report",
  ]),
  pillowGovernance: z.literal(true),
});

export type FinancialOperationsPluginManifest = z.infer<typeof financialOperationsPluginManifestSchema>;

export const VALID_FINANCIAL_STATUS_TRANSITIONS: Record<FinancialStatus, FinancialStatus[]> = {
  pending: ["processing", "blocked", "cancelled", "requires_review"],
  processing: ["completed", "failed", "requires_review", "blocked"],
  completed: ["reconciled", "requires_review"],
  failed: ["pending", "cancelled", "requires_review"],
  reconciled: [],
  requires_review: ["processing", "completed", "blocked", "cancelled"],
  blocked: ["pending", "requires_review", "cancelled"],
  cancelled: [],
};

export function isValidFinancialStatusTransition(from: FinancialStatus, to: FinancialStatus): boolean {
  return VALID_FINANCIAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function redactFinancialSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactFinancialSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactFinancialSecrets(entry),
      ]),
    );
  }
  return value;
}
