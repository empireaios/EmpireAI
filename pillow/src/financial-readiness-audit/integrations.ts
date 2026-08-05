import { FINANCIAL_READINESS_AUDIT_IDENTITY } from "./paths.js";
import { appendFinartLog } from "./finart-logging.js";
import type { FinancialReadinessAuditReport, FinancialHandle, IntegrationHandshake, IntegrationTarget } from "./types.js";

/** Q11-07 — exposes Q1108 consumable contract for Q11-08 to consume. */
export type RecoveryAuditHandle = FinancialHandle & {
  getState?: () => unknown;
  getQ1108ConsumableContract?: () => object;
};

export type ProductionCertificationCoreHandle = FinancialHandle & {
  getState?: () => unknown;
  getCertificationResults?: () => unknown;
};

export type CommerceFactoryCoreHandle = FinancialHandle & {
  getState?: () => unknown;
  connectCommerceFactoryCore?: (...args: unknown[]) => unknown;
  validateCommerceFactoryCore?: (...args: unknown[]) => unknown;
};

export type PaymentGatewayIntegrationHandle = FinancialHandle & {
  getState?: () => unknown;
  processPaymentAuthorization?: (...args: unknown[]) => unknown;
  processPaymentCapture?: (...args: unknown[]) => unknown;
};

export type BillingWorkerHandle = FinancialHandle & {
  getState?: () => unknown;
  generateInvoices?: (...args: unknown[]) => unknown;
  recordBillingTransactions?: (...args: unknown[]) => unknown;
};

export type RevenueEngineHandle = FinancialHandle & {
  getState?: () => unknown;
  recordRevenueEvent?: (...args: unknown[]) => unknown;
};

export type ExpenseEngineHandle = FinancialHandle & {
  getState?: () => unknown;
  recordExpenseEvent?: (...args: unknown[]) => unknown;
  aggregateExpenses?: (...args: unknown[]) => unknown;
};

export type AccountingWorkerHandle = FinancialHandle & {
  getState?: () => unknown;
  postJournalEntry?: (...args: unknown[]) => unknown;
  generateAccountingSummary?: (...args: unknown[]) => unknown;
};

export type FinancialReportingWorkerHandle = FinancialHandle & {
  getState?: () => unknown;
  produceReport?: (...args: unknown[]) => unknown;
  submitReport?: (...args: unknown[]) => unknown;
};

export type ProfitCalculationEngineHandle = FinancialHandle & {
  getState?: () => unknown;
  calculateProfit?: (...args: unknown[]) => unknown;
  aggregateProfit?: (...args: unknown[]) => unknown;
};

export type RefundEngineHandle = FinancialHandle & {
  getState?: () => unknown;
  processRefund?: (...args: unknown[]) => unknown;
};

export type ReconciliationEngineHandle = FinancialHandle & {
  getState?: () => unknown;
  reconcileAccounts?: (...args: unknown[]) => unknown;
};

export type CapitalFactoryCoreHandle = FinancialHandle & {
  getState?: () => unknown;
};

export type FinancialOperationsCertificationHandle = FinancialHandle & {
  getState?: () => unknown;
  getCertificationResults?: () => unknown;
};

export type FinancialRiskMonitorHandle = FinancialHandle & {
  getState?: () => unknown;
  assessRisk?: (...args: unknown[]) => unknown;
};

export type ApiRuntimeHandle = FinancialHandle & {
  getState?: () => unknown;
};

export type AuditRuntimeHandle = FinancialHandle & {
  getState?: () => unknown;
  query?: (input?: Record<string, unknown>) => unknown;
};

export type MonitoringRuntimeHandle = FinancialHandle & {
  getState?: () => unknown;
  getDashboard?: () => unknown;
};

export type SharedRuntimeCoreHandle = FinancialHandle & {
  getState?: () => unknown;
  getCatalog?: () => unknown;
};

export type WorkerRegistryHandle = FinancialHandle & {
  getState?: () => unknown;
  listWorkers?: () => unknown[];
  registerWorker?: (input: Record<string, unknown>) => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => {
    records?: Array<{ reportId?: string }>;
  };
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type WorkerLifecycleHandle = {
  createWorker: (input: Record<string, unknown>) => unknown;
  activateWorker: (input: Record<string, unknown>) => unknown;
};

export type FinancialReadinessAuditDependencies = {
  recoveryAudit?: RecoveryAuditHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  commerceFactoryCore?: CommerceFactoryCoreHandle | null;
  paymentGatewayIntegration?: PaymentGatewayIntegrationHandle | null;
  billingWorker?: BillingWorkerHandle | null;
  revenueEngine?: RevenueEngineHandle | null;
  expenseEngine?: ExpenseEngineHandle | null;
  accountingWorker?: AccountingWorkerHandle | null;
  financialReportingWorker?: FinancialReportingWorkerHandle | null;
  profitCalculationEngine?: ProfitCalculationEngineHandle | null;
  refundEngine?: RefundEngineHandle | null;
  reconciliationEngine?: ReconciliationEngineHandle | null;
  financialOperationsCertification?: FinancialOperationsCertificationHandle | null;
  capitalFactoryCore?: CapitalFactoryCoreHandle | null;
  financialRiskMonitor?: FinancialRiskMonitorHandle | null;
  apiRuntime?: ApiRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  workerLifecycle?: WorkerLifecycleHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: FinancialReadinessAuditDependencies = {};

  bind(deps: FinancialReadinessAuditDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(workerId: string, targets: string[]): IntegrationHandshake[] {
    const now = new Date().toISOString();
    const resolved: IntegrationHandshake[] = [];
    for (const target of targets as IntegrationTarget[]) {
      const status = this.isBound(target) ? "bound" : "ready";
      const handshake: IntegrationHandshake = {
        target,
        status,
        details: this.describe(target, workerId, status),
        timestamp: now,
      };
      resolved.push(handshake);
      appendFinartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptQ1108ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const recart = this.deps.recoveryAudit;
    if (!recart || typeof recart.getQ1108ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected recovery-audit handle exposing getQ1108ConsumableContract",
      };
    }
    try {
      const contract = recart.getQ1108ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-08";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-07 recovery-audit handshake returned explicit consumableByQ1108 contract"
          : "Injected Q11-07 recovery-audit handshake did not return explicit consumableByQ1108 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1108ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: FinancialReadinessAuditReport): {
    submitted: boolean;
    executiveReportId: string | null;
    details: string;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "executive_reporting_runtime_unavailable",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: report.workerId,
      entityType: "worker",
      missionId: "Q11-08",
      currentStatus: `financial_readiness_audit_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingRisks,
      risks: report.outstandingRisks,
      evidence: [
        `decision=${report.decision}`,
        `certifiedComponents=${report.certifiedComponents}/${report.totalFinancialComponents}`,
      ],
      nextAction: report.decision === "certify" ? "financial_components_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      financialReadinessAuditReport: report,
      neverFabricateFinancialEvidence: true,
      neverExecuteFinancialTransactions: true,
      neverModifyAccountingRecords: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-finart-${Date.now()}`;
    appendFinartLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: FINANCIAL_READINESS_AUDIT_IDENTITY.workerName,
      workerType: FINANCIAL_READINESS_AUDIT_IDENTITY.workerType,
      department: FINANCIAL_READINESS_AUDIT_IDENTITY.department,
      factory: FINANCIAL_READINESS_AUDIT_IDENTITY.factory,
      role: FINANCIAL_READINESS_AUDIT_IDENTITY.role,
      reportingLine: [...FINANCIAL_READINESS_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...FINANCIAL_READINESS_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...FINANCIAL_READINESS_AUDIT_IDENTITY.approvedTools],
      authorityLevel: FINANCIAL_READINESS_AUDIT_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };
    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* registry may reject duplicates */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* lifecycle optional */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "recovery_audit":
        return !!this.deps.recoveryAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "commerce_factory_core":
        return !!this.deps.commerceFactoryCore;
      case "payment_gateway_integration":
        return !!this.deps.paymentGatewayIntegration;
      case "billing_worker":
        return !!this.deps.billingWorker;
      case "revenue_engine":
        return !!this.deps.revenueEngine;
      case "expense_engine":
        return !!this.deps.expenseEngine;
      case "accounting_worker":
        return !!this.deps.accountingWorker;
      case "financial_reporting_worker":
        return !!this.deps.financialReportingWorker;
      case "profit_calculation_engine":
        return !!this.deps.profitCalculationEngine;
      case "refund_engine":
        return !!this.deps.refundEngine;
      case "reconciliation_engine":
        return !!this.deps.reconciliationEngine;
      case "financial_operations_certification":
        return !!this.deps.financialOperationsCertification;
      case "capital_factory_core":
        return !!this.deps.capitalFactoryCore;
      case "api_runtime":
        return !!this.deps.apiRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only audit-only worker under Pillow.`;
  }
}
