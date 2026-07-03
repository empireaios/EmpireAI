/**
 * G7-05 — Grand King Revenue & Financial Operations service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID, LUMINOUSYOU_BRAND_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { resolveConnectionProviders } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import type { FinancialDomainId, FinancialRecord } from "../contracts/financial-operations-types.js";
import { FINANCIAL_DOMAIN_IDS, GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION } from "../contracts/financial-operations-types.js";
import { recordFinancialEklsObservation } from "../ekls/financial-operations-ekls-integration.js";
import { validateFinancialOperationsPillowGovernance } from "../governance/financial-operations-pillow-governance.js";
import {
  deriveRateSignalFromRef,
  resolveDomainForProvider,
  resolveFinancialOperationDependencies,
  resolveTransactionTypeForDomain,
} from "../registry/financial-operations-registry-resolver.js";
import {
  appendFinancialRecord,
  getFinancialRecord,
  listFinancialRecords,
  transitionFinancialRecordStatus,
} from "./financial-ledger.js";
import { aggregateFinancialKpis } from "./financial-kpi-engine.js";
import {
  buildExecutiveFinanceDashboard,
  buildFinancialRiskRegister,
  getCashPosition,
  getExecutiveFinancialSummary,
} from "./executive-finance-dashboard.js";
import { computeProfitability } from "./profitability-engine.js";
import { trackAdvertisingSpend } from "./advertising-spend-tracker.js";
import { trackSubscriptions } from "./subscription-tracker.js";
import type { FinancialOperationsOverview } from "../contracts/financial-operations-types.js";

let initialized = false;

export function resetFinancialOperationsStateForTests(): void {
  initialized = false;
}

function commerceSignalMultiplier(context: RegistryLoaderContext): number {
  try {
    const ops = listCommerceOperations();
    const active = ops.filter((op) => op.status === "running" || op.status === "ready").length;
    return Math.max(active, 1);
  } catch {
    return 1;
  }
}

function createFinancialRecord(input: {
  providerId: string;
  domainId: FinancialDomainId;
  deps: ReturnType<typeof resolveFinancialOperationDependencies>;
  signal: number;
  correlationId: string;
}): FinancialRecord {
  const now = new Date().toISOString();
  const transactionType = resolveTransactionTypeForDomain(input.domainId);
  const isExpense =
    transactionType === "expense" ||
    transactionType === "advertising" ||
    transactionType === "refund" ||
    transactionType === "chargeback";

  const grossAmount = isExpense ? input.signal * 50 : input.signal * 100;
  const feeRate = input.deps.feeRateRefs.reduce((sum, ref) => sum + deriveRateSignalFromRef(ref), 0);
  const taxRate = input.deps.taxRateRefs.reduce((sum, ref) => sum + deriveRateSignalFromRef(ref), 0);
  const fees = Math.round(grossAmount * feeRate * 100) / 100;
  const taxAmount = Math.round(grossAmount * taxRate * 100) / 100;
  const refundAmount =
    input.domainId === "refunds" ? grossAmount : 0;
  const netAmount = isExpense
    ? -(grossAmount + fees)
    : grossAmount - fees - taxAmount - refundAmount;

  return {
    financialRecordId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    brandId: LUMINOUSYOU_BRAND_ID,
    providerId: input.providerId,
    transactionType,
    currency: input.deps.defaultCurrency ?? "USD",
    grossAmount: Math.round(grossAmount * 100) / 100,
    fees,
    refundAmount,
    taxAmount,
    netAmount: Math.round(netAmount * 100) / 100,
    status: "completed",
    reconciliationStatus: "unreconciled",
    evidence: [{
      evidenceId: `ev-${input.providerId}-${input.domainId}`,
      kind: "reference",
      summary: `Financial aggregate from REG-CONNECTION-PROVIDER ${input.providerId}`,
      ref: `REG-CONNECTION-PROVIDER:${input.providerId}`,
    }],
    createdAt: now,
    updatedAt: now,
    correlationId: input.correlationId,
    governanceState: "pillow-approved",
    domainId: input.domainId,
  };
}

function seedDerivedRecords(
  deps: ReturnType<typeof resolveFinancialOperationDependencies>,
  signal: number,
  correlationId: string,
): void {
  const derivedDomains: FinancialDomainId[] = [
    "subscription_revenue",
    "refunds",
    "chargebacks",
    "shipping_cost",
    "operational_cost",
    "net_profit",
    "cash_position",
    "projected_profit",
  ];

  for (const domainId of derivedDomains) {
    const record = createFinancialRecord({
      providerId: `derived:${domainId}`,
      domainId,
      deps,
      signal: domainId === "subscription_revenue" ? signal * 0.5 : signal * 0.2,
      correlationId,
    });
    if (domainId === "refunds" || domainId === "chargebacks") {
      record.status = "completed";
    }
    if (domainId === "cash_position" || domainId === "net_profit" || domainId === "projected_profit") {
      record.transactionType = "adjustment";
      record.status = "reconciled";
      record.reconciliationStatus = "reconciled";
    }
    appendFinancialRecord(record);
    recordFinancialEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      financialRecordId: record.financialRecordId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "financial_record_created",
      summary: `Financial record created for ${domainId}`,
      pillowGovernance: true,
    });
  }

  const payoutRecord = createFinancialRecord({
    providerId: "payout:stripe",
    domainId: "stripe_revenue",
    deps,
    signal: signal * 0.3,
    correlationId,
  });
  payoutRecord.transactionType = "payout";
  payoutRecord.status = "pending";
  appendFinancialRecord(payoutRecord);
}

export function initializeFinancialOperations(context: RegistryLoaderContext = {}): {
  records: FinancialRecord[];
  overview: FinancialOperationsOverview;
} {
  if (initialized) {
    return {
      records: listFinancialRecords(),
      overview: getFinancialOperationsOverview(context),
    };
  }

  const deps = resolveFinancialOperationDependencies(context);
  const correlationId = randomUUID();
  const signal = commerceSignalMultiplier(context);
  const providers = resolveConnectionProviders(context);

  for (const provider of providers) {
    const domainId = resolveDomainForProvider(provider.providerId);
    if (!domainId) continue;

    const record = createFinancialRecord({
      providerId: provider.providerId,
      domainId,
      deps,
      signal,
      correlationId,
    });
    appendFinancialRecord(record);
    recordFinancialEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      financialRecordId: record.financialRecordId,
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "financial_record_created",
      summary: `Financial record created for ${provider.providerId}`,
      pillowGovernance: true,
    });
  }

  seedDerivedRecords(deps, signal, correlationId);

  const profitability = computeProfitability(context);
  recordFinancialEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    financialRecordId: "profitability",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "profitability_updated",
    summary: `Profitability updated — net profit ${profitability.netProfit}`,
    pillowGovernance: true,
  });

  const risks = buildFinancialRiskRegister(context);
  if (risks.riskCount > 0) {
    recordFinancialEklsObservation({
      actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      financialRecordId: "risk-scan",
      ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
      kind: "financial_anomaly_detected",
      summary: `${risks.riskCount} financial anomalies detected`,
      pillowGovernance: true,
    });
  }

  recordFinancialEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    financialRecordId: "learning",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "financial_learning_recorded",
    summary: "Financial operations learning baseline recorded",
    pillowGovernance: true,
  });

  initialized = true;
  return {
    records: listFinancialRecords(),
    overview: getFinancialOperationsOverview(context),
  };
}

export function getFinancialOperationsOverview(context: RegistryLoaderContext = {}): FinancialOperationsOverview {
  const records = listFinancialRecords();
  return {
    frameworkVersion: GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION,
    domainCount: FINANCIAL_DOMAIN_IDS.length,
    recordCount: records.length,
    reconciledCount: records.filter((r) => r.status === "reconciled").length,
    pendingReviewCount: records.filter((r) => r.status === "requires_review" || r.status === "pending").length,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    accountHolderId: GRAND_KING_ACCOUNT_HOLDER_ID,
    generatedAt: new Date().toISOString(),
  };
}

export function reconcileFinancialRecord(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  financialRecordId: string;
  pillowGovernance: true;
}): FinancialRecord {
  const pillow = validateFinancialOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "reconcile",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    throw new Error(pillow.reason);
  }

  const updated = transitionFinancialRecordStatus(input.financialRecordId, "reconciled");
  recordFinancialEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    financialRecordId: input.financialRecordId,
    ownerId: input.ownerId,
    kind: "financial_reconciled",
    summary: `Financial record ${input.financialRecordId} reconciled`,
    pillowGovernance: true,
  });
  return updated;
}

export {
  getFinancialRecord,
  listFinancialRecords,
  aggregateFinancialKpis,
  buildExecutiveFinanceDashboard,
  buildFinancialRiskRegister,
  getCashPosition,
  getExecutiveFinancialSummary,
  computeProfitability,
  trackAdvertisingSpend,
  trackSubscriptions,
};

export function getFinancialHealth(context: RegistryLoaderContext = {}) {
  const kpis = aggregateFinancialKpis(context);
  const overview = getFinancialOperationsOverview(context);
  return { kpis, overview, status: "operational" as const };
}

export function getFinancialStatus(context: RegistryLoaderContext = {}) {
  const deps = resolveFinancialOperationDependencies(context);
  const overview = getFinancialOperationsOverview(context);
  return {
    frameworkVersion: GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION,
    initialized,
    overview,
    registryIds: deps,
    programmeStatus: "revenue-financial-operations-established",
  };
}
