import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import { buildFinancialAssessmentMatrix } from "./financial-classifier.js";
import type { FinancialAssessment } from "./types.js";

/** Structural capability probe — builds assessment matrix from presence-only evidence. NEVER invokes mutating financial methods. */
export function probeFinancialCapabilities(deps: FinancialReadinessAuditDependencies): FinancialAssessment[] {
  return buildFinancialAssessmentMatrix(deps);
}

export function verifyPaymentWorkflows(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    paymentWorkflowStatus: row.paymentWorkflowStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyRevenueRecording(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    revenueRecordingStatus: row.revenueRecordingStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyExpenseTracking(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    expenseTrackingStatus: row.expenseTrackingStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyAccountingRecords(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    accountingRecordsStatus: row.accountingRecordsStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyFinancialReporting(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    financialReportingStatus: row.financialReportingStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyCostControls(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    costControlStatus: row.costControlStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyFinancialGovernance(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    financialGovernanceStatus: row.financialGovernanceStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyAuditTraceability(deps: FinancialReadinessAuditDependencies) {
  return buildFinancialAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    auditTraceabilityStatus: row.auditTraceabilityStatus,
    evidence: row.supportingEvidence,
  }));
}
