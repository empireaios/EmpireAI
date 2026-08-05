import { countPresentMethods } from "./evidence-collector.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import type { AllFinancialComponentKey, CheckStatus, FinancialReadinessClassification, FinancialAssessment } from "./types.js";
import { handleFor } from "./financial-discovery.js";
import {
  ALL_FINANCIAL_COMPONENT_KEYS,
  FINANCIAL_COMPONENT_PROBES,
  FINANCIAL_COMPONENT_TYPES,
} from "./paths.js";

let checkSeq = 0;

export function nextFinancialCheckId() {
  checkSeq += 1;
  return `finart-chk-${String(checkSeq).padStart(4, "0")}`;
}

export function resetFinancialCheckSequenceForTesting() {
  checkSeq = 0;
}

function capabilityStatus(
  handle: object | null | undefined,
  methodNames: string[],
): { status: CheckStatus; presentCount: number; total: number } {
  if (!handle) return { status: "Missing", presentCount: 0, total: methodNames.length };
  const total = methodNames.length;
  const presentCount = countPresentMethods(handle, methodNames);
  const status: CheckStatus = presentCount === total ? "Passed" : presentCount > 0 ? "Partial" : "Failed";
  return { status, presentCount, total };
}

function notApplicable(dimension: string, componentKey: string, ownedBy: string): { status: CheckStatus; note: string } {
  return {
    status: "Passed",
    note: `${dimension} not applicable to ${componentKey} — evaluated by ${ownedBy}; vacuously satisfied by design scope`,
  };
}

const FINANCIAL_SCENARIOS: Record<AllFinancialComponentKey, string> = {
  "commerce-factory-core": "commerce_financial_foundation_gap",
  "payment-gateway-integration": "payment_capture_failure",
  "billing-worker": "billing_workflow_gap",
  "revenue-engine": "revenue_recording_gap",
  "expense-engine": "expense_tracking_gap",
  "accounting-worker": "accounting_records_gap",
  "financial-reporting-worker": "financial_reporting_gap",
  "profit-calculation-engine": "cost_control_gap",
  "audit-runtime": "financial_audit_trail_gap",
  "executive-reporting-runtime": "executive_financial_reporting_gap",
  "production-certification-core": "certification_signal_gap",
  "api-runtime": "financial_api_integration_gap",
  "monitoring-runtime": "financial_monitoring_gap",
  "refund-engine": "refund_capability_gap",
  "reconciliation-engine": "reconciliation_capability_gap",
  "capital-factory-core": "capital_factory_signal_gap",
  "financial-operations-certification": "financial_operations_certification_gap",
  "financial-risk-monitor": "financial_risk_monitoring_gap",
};

export type ComponentDimensionResult = {
  paymentWorkflowStatus: CheckStatus;
  revenueRecordingStatus: CheckStatus;
  expenseTrackingStatus: CheckStatus;
  accountingRecordsStatus: CheckStatus;
  financialReportingStatus: CheckStatus;
  costControlStatus: CheckStatus;
  financialGovernanceStatus: CheckStatus;
  auditTraceabilityStatus: CheckStatus;
  evidence: string[];
};

export function classifyComponentDimensions(
  componentKey: AllFinancialComponentKey,
  deps: FinancialReadinessAuditDependencies,
): ComponentDimensionResult {
  const handle = handleFor(componentKey, deps) ?? null;
  const probes = FINANCIAL_COMPONENT_PROBES[componentKey];

  if (!handle) {
    return {
      paymentWorkflowStatus: "Missing",
      revenueRecordingStatus: "Missing",
      expenseTrackingStatus: "Missing",
      accountingRecordsStatus: "Missing",
      financialReportingStatus: "Missing",
      costControlStatus: "Missing",
      financialGovernanceStatus: "Missing",
      auditTraceabilityStatus: "Missing",
      evidence: [`discovered=false — no ${componentKey} handle injected; none invented`],
    };
  }

  const getStateCap = capabilityStatus(handle, ["getState"]);
  const probeCap = capabilityStatus(handle, probes);

  switch (componentKey) {
    case "payment-gateway-integration": {
      const payment = capabilityStatus(handle, ["processPaymentAuthorization", "processPaymentCapture"]);
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine/billing-worker");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: payment.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          `paymentWorkflowStatus=${payment.status} (processPaymentAuthorization/processPaymentCapture present=${payment.presentCount}/${payment.total}; NEVER invoked)`,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "billing-worker": {
      const payment = capabilityStatus(handle, ["generateInvoices", "recordBillingTransactions"]);
      const revenue = capabilityStatus(handle, ["recordBillingTransactions"]);
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: payment.status,
        revenueRecordingStatus: revenue.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          `paymentWorkflowStatus=${payment.status} (generateInvoices/recordBillingTransactions present=${payment.presentCount}/${payment.total}; NEVER invoked)`,
          `revenueRecordingStatus=${revenue.status} (recordBillingTransactions present=${revenue.presentCount > 0}; NEVER invoked)`,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "revenue-engine": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenue = capabilityStatus(handle, ["recordRevenueEvent"]);
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenue.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          `revenueRecordingStatus=${revenue.status} (recordRevenueEvent present=${revenue.presentCount > 0}; NEVER invoked)`,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "expense-engine": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expense = capabilityStatus(handle, ["recordExpenseEvent", "aggregateExpenses"]);
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expense.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          `expenseTrackingStatus=${expense.status} (recordExpenseEvent/aggregateExpenses present=${expense.presentCount}/${expense.total}; NEVER invoked)`,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "accounting-worker": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accounting = capabilityStatus(handle, ["postJournalEntry", "generateAccountingSummary"]);
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accounting.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          `accountingRecordsStatus=${accounting.status} (postJournalEntry/generateAccountingSummary present=${accounting.presentCount}/${accounting.total}; NEVER invoked)`,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "financial-reporting-worker": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reporting = capabilityStatus(handle, ["produceReport", "submitReport"]);
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reporting.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          `financialReportingStatus=${reporting.status} (produceReport/submitReport present=${reporting.presentCount}/${reporting.total}; NEVER invoked)`,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "profit-calculation-engine": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const cost = capabilityStatus(handle, ["calculateProfit", "aggregateProfit"]);
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: cost.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          `costControlStatus=${cost.status} (calculateProfit/aggregateProfit present=${cost.presentCount}/${cost.total}; NEVER invoked)`,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "audit-runtime": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const audit = capabilityStatus(handle, ["query", "getState"]);
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: audit.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          `auditTraceabilityStatus=${audit.status} (query/getState present=${audit.presentCount}/${audit.total}; NEVER invoked)`,
        ],
      };
    }
    case "refund-engine": {
      const payment = capabilityStatus(handle, ["processRefund"]);
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: payment.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          `paymentWorkflowStatus=${payment.status} (processRefund present=${payment.presentCount > 0}; NEVER invoked)`,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    case "reconciliation-engine": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accounting = capabilityStatus(handle, ["reconcileAccounts"]);
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = getStateCap;
      const audit = capabilityStatus(handle, ["reconcileAccounts", "getState"]);
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accounting.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: audit.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          `accountingRecordsStatus=${accounting.status} (reconcileAccounts present=${accounting.presentCount > 0}; NEVER invoked)`,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status}`,
          `auditTraceabilityStatus=${audit.status} (reconcileAccounts/getState present=${audit.presentCount}/${audit.total}; NEVER invoked)`,
        ],
      };
    }
    case "financial-risk-monitor": {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const cost = capabilityStatus(handle, ["assessRisk"]);
      const governance = getStateCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: cost.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          `costControlStatus=${cost.status} (assessRisk present=${cost.presentCount > 0}; NEVER invoked)`,
          `financialGovernanceStatus=${governance.status}`,
          auditNa.note,
        ],
      };
    }
    default: {
      const paymentNa = notApplicable("paymentWorkflowStatus", componentKey, "payment-gateway-integration/billing-worker");
      const revenueNa = notApplicable("revenueRecordingStatus", componentKey, "revenue-engine");
      const expenseNa = notApplicable("expenseTrackingStatus", componentKey, "expense-engine");
      const accountingNa = notApplicable("accountingRecordsStatus", componentKey, "accounting-worker");
      const reportingNa = notApplicable("financialReportingStatus", componentKey, "financial-reporting-worker");
      const costNa = notApplicable("costControlStatus", componentKey, "profit-calculation-engine");
      const governance = probeCap;
      const auditNa = notApplicable("auditTraceabilityStatus", componentKey, "audit-runtime");
      return {
        paymentWorkflowStatus: paymentNa.status,
        revenueRecordingStatus: revenueNa.status,
        expenseTrackingStatus: expenseNa.status,
        accountingRecordsStatus: accountingNa.status,
        financialReportingStatus: reportingNa.status,
        costControlStatus: costNa.status,
        financialGovernanceStatus: governance.status,
        auditTraceabilityStatus: auditNa.status,
        evidence: [
          paymentNa.note,
          revenueNa.note,
          expenseNa.note,
          accountingNa.note,
          reportingNa.note,
          costNa.note,
          `financialGovernanceStatus=${governance.status} (${probeCap.presentCount}/${probeCap.total} catalogued probe methods present; NEVER invoked)`,
          auditNa.note,
        ],
      };
    }
  }
}

export function classifyFinancialReadiness(statuses: {
  paymentWorkflowStatus: CheckStatus;
  revenueRecordingStatus: CheckStatus;
  expenseTrackingStatus: CheckStatus;
  accountingRecordsStatus: CheckStatus;
  financialReportingStatus: CheckStatus;
  costControlStatus: CheckStatus;
  financialGovernanceStatus: CheckStatus;
  auditTraceabilityStatus: CheckStatus;
}): FinancialReadinessClassification {
  const all = [
    statuses.paymentWorkflowStatus,
    statuses.revenueRecordingStatus,
    statuses.expenseTrackingStatus,
    statuses.accountingRecordsStatus,
    statuses.financialReportingStatus,
    statuses.costControlStatus,
    statuses.financialGovernanceStatus,
    statuses.auditTraceabilityStatus,
  ];
  if (all.every((s) => s === "Missing")) return "missing";
  if (all.some((s) => s === "Missing")) return "missing";
  if (all.some((s) => s === "Failed")) return "failed";
  if (all.every((s) => s === "Passed")) return "certified";
  return "partially_certified";
}

export function assessComponent(
  componentKey: AllFinancialComponentKey,
  componentId: string,
  statuses: ComponentDimensionResult,
  readinessClassification: FinancialReadinessClassification,
  auditReference: string,
  supportingEvidence: string[],
): FinancialAssessment {
  return {
    financialCheckId: nextFinancialCheckId(),
    componentId,
    componentType: FINANCIAL_COMPONENT_TYPES[componentKey],
    financialScenario: FINANCIAL_SCENARIOS[componentKey],
    paymentWorkflowStatus: statuses.paymentWorkflowStatus,
    revenueRecordingStatus: statuses.revenueRecordingStatus,
    expenseTrackingStatus: statuses.expenseTrackingStatus,
    accountingRecordsStatus: statuses.accountingRecordsStatus,
    financialReportingStatus: statuses.financialReportingStatus,
    costControlStatus: statuses.costControlStatus,
    financialGovernanceStatus: statuses.financialGovernanceStatus,
    auditTraceabilityStatus: statuses.auditTraceabilityStatus,
    readinessClassification,
    supportingEvidence,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}

export function buildFinancialAssessmentMatrix(deps: FinancialReadinessAuditDependencies): FinancialAssessment[] {
  return ALL_FINANCIAL_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    if (!handle) {
      const empty: ComponentDimensionResult = {
        paymentWorkflowStatus: "Missing",
        revenueRecordingStatus: "Missing",
        expenseTrackingStatus: "Missing",
        accountingRecordsStatus: "Missing",
        financialReportingStatus: "Missing",
        costControlStatus: "Missing",
        financialGovernanceStatus: "Missing",
        auditTraceabilityStatus: "Missing",
        evidence: [`discovered=false — no ${componentKey} handle injected`],
      };
      return assessComponent(
        componentKey,
        componentKey,
        empty,
        "missing",
        `component:${componentKey}`,
        empty.evidence,
      );
    }
    const dims = classifyComponentDimensions(componentKey, deps);
    const classification = classifyFinancialReadiness(dims);
    return assessComponent(
      componentKey,
      componentKey,
      dims,
      classification,
      `component:${componentKey}`,
      [`discovered=true`, ...dims.evidence],
    );
  });
}
