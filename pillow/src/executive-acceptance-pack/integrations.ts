import { appendEaprtLog } from "./eaprt-logging.js";
import type { ExecutiveAcceptancePackReport, EaprtHandle, IntegrationHandshake, IntegrationTarget } from "./types.js";

export type AuditEngineHandle = EaprtHandle & {
  getState?: () => { latestReport?: unknown; missionId?: string };
  getLatestReport?: () => { reportId?: string; decision?: string; auditStatus?: string; missionId?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string; auditStatus?: string }>;
  produceReport?: (...args: unknown[]) => unknown;
};

export type FinancialReadinessAuditHandle = AuditEngineHandle & {
  getQ1109ConsumableContract?: () => object;
};

export type ProductionCertificationCoreHandle = EaprtHandle & {
  getState?: () => unknown;
  getCertificationResults?: () => unknown;
  getLatestReport?: () => { reportId?: string; decision?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string }>;
  produceReport?: (...args: unknown[]) => unknown;
};

export type SharedRuntimeCertificationHandle = EaprtHandle & {
  getState?: () => unknown;
  getLatestReport?: () => { reportId?: string; decision?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string }>;
  produceReport?: (...args: unknown[]) => unknown;
};

export type MonitoringRuntimeHandle = EaprtHandle & {
  getState?: () => unknown;
  getDashboard?: () => unknown;
};

export type AuditRuntimeHandle = EaprtHandle & {
  getState?: () => unknown;
  query?: (input?: Record<string, unknown>) => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => {
    records?: Array<{ reportId?: string }>;
  };
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type ExecutiveAcceptancePackDependencies = {
  financialReadinessAudit?: FinancialReadinessAuditHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  sharedRuntimeCertification?: SharedRuntimeCertificationHandle | null;
  workerReadinessAudit?: AuditEngineHandle | null;
  pillowCommandAudit?: AuditEngineHandle | null;
  businessFactoryAudit?: AuditEngineHandle | null;
  securityAudit?: AuditEngineHandle | null;
  performanceAudit?: AuditEngineHandle | null;
  recoveryAudit?: AuditEngineHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ExecutiveAcceptancePackDependencies = {};

  bind(deps: ExecutiveAcceptancePackDependencies = {}) {
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
      appendEaprtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  attemptQ1109ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const finart = this.deps.financialReadinessAudit;
    if (!finart || typeof finart.getQ1109ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Q11-08 Financial Readiness Audit not implemented / not injected",
      };
    }
    try {
      const contract = finart.getQ1109ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-09";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-08 financial-readiness-audit handshake returned explicit consumableByQ1109 contract"
          : "Injected Q11-08 financial-readiness-audit handshake did not return explicit consumableByQ1109 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1109ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: ExecutiveAcceptancePackReport): {
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
      missionId: "Q11-09",
      currentStatus: `executive_acceptance_pack_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.riskSummary.criticalRisks,
      evidence: [
        `decision=${report.decision}`,
        `deploymentRecommendation=${report.deploymentRecommendation.recommendation}`,
      ],
      nextAction:
        report.decision === "certify" ? "await_grand_king_acceptance_gate" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      executiveAcceptancePackReport: report,
      neverFabricateAcceptanceEvidence: true,
      neverApproveProductionDeployment: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-eaprt-${Date.now()}`;
    appendEaprtLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "financial_readiness_audit":
        return !!this.deps.financialReadinessAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "shared_runtime_certification":
        return !!this.deps.sharedRuntimeCertification;
      case "worker_readiness_audit":
        return !!this.deps.workerReadinessAudit;
      case "pillow_command_audit":
        return !!this.deps.pillowCommandAudit;
      case "business_factory_audit":
        return !!this.deps.businessFactoryAudit;
      case "security_audit":
        return !!this.deps.securityAudit;
      case "performance_audit":
        return !!this.deps.performanceAudit;
      case "recovery_audit":
        return !!this.deps.recoveryAudit;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only aggregation worker under Pillow.`;
  }
}

function integrationBound(
  deps: ExecutiveAcceptancePackDependencies,
  target: IntegrationTarget,
): boolean {
  switch (target) {
    case "financial_readiness_audit":
      return !!deps.financialReadinessAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "shared_runtime_certification":
      return !!deps.sharedRuntimeCertification;
    case "worker_readiness_audit":
      return !!deps.workerReadinessAudit;
    case "pillow_command_audit":
      return !!deps.pillowCommandAudit;
    case "business_factory_audit":
      return !!deps.businessFactoryAudit;
    case "security_audit":
      return !!deps.securityAudit;
    case "performance_audit":
      return !!deps.performanceAudit;
    case "recovery_audit":
      return !!deps.recoveryAudit;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    default:
      return false;
  }
}

export function verifyIntegrations(deps: ExecutiveAcceptancePackDependencies) {
  const now = new Date().toISOString();
  const targets: IntegrationTarget[] = [
    "financial_readiness_audit",
    "production_certification_core",
    "shared_runtime_certification",
    "worker_readiness_audit",
    "pillow_command_audit",
    "business_factory_audit",
    "security_audit",
    "performance_audit",
    "recovery_audit",
    "executive_reporting_runtime",
    "audit_runtime",
    "monitoring_runtime",
  ];
  const rows = targets.map((target) => {
    const bound = integrationBound(deps, target);
    return {
      target,
      bound,
      evidence: bound ? `${target} handle injected` : `${target} not injected`,
    };
  });
  const boundCount = rows.filter((r) => r.bound).length;
  return {
    verifiedAt: now,
    rows,
    totalTargets: targets.length,
    boundCount,
    allBound: boundCount === targets.length,
    evidence: rows.map((r) => r.evidence),
  };
}
