import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ALL_FINANCIAL_COMPONENT_KEYS,
  FINANCIAL_READINESS_AUDIT_SYSTEM_PATH,
  REQUIRED_FINANCIAL_COMPONENT_KEYS,
} from "./paths.js";
import type { FinancialReadinessAuditConfiguration } from "./configuration.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import type {
  GovernanceSummary,
  FinancialAssessment,
  FinancialDimensionSummary,
  FinancialReadinessSummary,
} from "./types.js";

export function evaluateGovernanceSummary(
  repositoryRoot: string,
  config: FinancialReadinessAuditConfiguration,
  deps: FinancialReadinessAuditDependencies,
): GovernanceSummary {
  const selfDocPath = join(repositoryRoot, FINANCIAL_READINESS_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfDocPath);
  const requiredBound = REQUIRED_FINANCIAL_COMPONENT_KEYS.filter((key) => {
    switch (key) {
      case "payment-gateway-integration":
        return !!deps.paymentGatewayIntegration;
      case "revenue-engine":
        return !!deps.revenueEngine;
      case "audit-runtime":
        return !!deps.auditRuntime;
      default:
        return false;
    }
  }).length;
  const compliant =
    selfDocPresent &&
    config.neverFabricateFinancialEvidence &&
    config.neverExecuteFinancialTransactions &&
    config.neverImplementQ1109OrLater;
  return {
    compliant,
    grandKingApprovalRequired: true,
    financialReadinessAuditRequired: true,
    selfDocPresent,
    selfDocPath: FINANCIAL_READINESS_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured: config.neverImplementQ1109OrLater,
    requiredComponentsBoundCount: requiredBound,
    totalRequiredComponents: REQUIRED_FINANCIAL_COMPONENT_KEYS.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `requiredComponentsBound=${requiredBound}/${REQUIRED_FINANCIAL_COMPONENT_KEYS.length}`,
      `neverExecuteFinancialTransactions=${config.neverExecuteFinancialTransactions}`,
    ],
  };
}

export function evaluateFinancialReadinessSummary(matrix: FinancialAssessment[]): FinancialReadinessSummary {
  const now = new Date().toISOString();
  const totalComponents = matrix.length;
  const certifiedCount = matrix.filter((r) => r.readinessClassification === "certified").length;
  const partiallyCertifiedCount = matrix.filter((r) => r.readinessClassification === "partially_certified").length;
  const failedCount = matrix.filter((r) => r.readinessClassification === "failed").length;
  const missingCount = matrix.filter((r) => r.readinessClassification === "missing").length;
  const blockedCount = matrix.filter((r) => r.readinessClassification === "blocked").length;
  const deferredCount = matrix.filter((r) => r.readinessClassification === "deferred").length;
  const overallReadinessScore =
    totalComponents === 0 ? 0 : Math.round((certifiedCount + partiallyCertifiedCount * 0.5) / totalComponents * 100) / 100;
  return {
    computedAt: now,
    totalComponents,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    allCertified: totalComponents > 0 && certifiedCount === totalComponents,
    notes: [
      "Financial readiness derived strictly from capability-presence evidence — mutating financial methods NEVER invoked during audit",
    ],
    evidence: [
      `certified=${certifiedCount}`,
      `partially_certified=${partiallyCertifiedCount}`,
      `failed=${failedCount}`,
      `missing=${missingCount}`,
    ],
  };
}

function dimensionSummary(
  dimension: FinancialDimensionSummary["dimension"],
  matrix: FinancialAssessment[],
  pick: (row: FinancialAssessment) => string,
): FinancialDimensionSummary {
  const statuses = matrix.map(pick);
  return {
    dimension,
    passedCount: statuses.filter((s) => s === "Passed").length,
    partialCount: statuses.filter((s) => s === "Partial").length,
    failedCount: statuses.filter((s) => s === "Failed").length,
    missingCount: statuses.filter((s) => s === "Missing").length,
    totalComponents: matrix.length,
    evidence: [`${dimension} assessed across ${matrix.length} catalogued components`],
  };
}

export function evaluatePaymentWorkflowSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("paymentWorkflows", matrix, (r) => r.paymentWorkflowStatus);
}

export function evaluateRevenueRecordingSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("revenueRecording", matrix, (r) => r.revenueRecordingStatus);
}

export function evaluateExpenseTrackingSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("expenseTracking", matrix, (r) => r.expenseTrackingStatus);
}

export function evaluateAccountingRecordsSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("accountingRecords", matrix, (r) => r.accountingRecordsStatus);
}

export function evaluateFinancialReportingSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("financialReporting", matrix, (r) => r.financialReportingStatus);
}

export function evaluateCostControlSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("costControls", matrix, (r) => r.costControlStatus);
}

export function evaluateFinancialGovernanceSummary(matrix: FinancialAssessment[]) {
  return dimensionSummary("financialGovernance", matrix, (r) => r.financialGovernanceStatus);
}

export function evaluateAuditTraceabilitySummary(matrix: FinancialAssessment[]): FinancialDimensionSummary {
  const now = new Date().toISOString();
  const statuses = matrix.map((r) => r.auditTraceabilityStatus);
  return {
    dimension: "auditTraceability",
    passedCount: statuses.filter((s) => s === "Passed").length,
    partialCount: statuses.filter((s) => s === "Partial").length,
    failedCount: statuses.filter((s) => s === "Failed").length,
    missingCount: statuses.filter((s) => s === "Missing").length,
    totalComponents: matrix.length,
    evidence: [`auditTraceability assessed at ${now} across ${ALL_FINANCIAL_COMPONENT_KEYS.length} catalogued keys`],
  };
}

export function evaluateReadinessClassificationSummary(matrix: FinancialAssessment[]): FinancialDimensionSummary {
  const now = new Date().toISOString();
  const classifications = matrix.map((r) => r.readinessClassification);
  return {
    dimension: "financialGovernance",
    passedCount: classifications.filter((c) => c === "certified").length,
    partialCount: classifications.filter((c) => c === "partially_certified").length,
    failedCount: classifications.filter((c) => c === "failed").length,
    missingCount: classifications.filter((c) => c === "missing").length,
    totalComponents: matrix.length,
    evidence: [`readinessClassification assessed at ${now} across ${matrix.length} components`],
  };
}
