import { appendQscptLog } from "./qscpt-logging.js";
import type { IntegrationHandshake, IntegrationTarget, QSeriesCompletionReport } from "./types.js";

export type AuditEngineHandle = {
  getState?: () => unknown;
  getLatestReport?: () => { reportId?: string; decision?: string; auditStatus?: string; missionId?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string; auditStatus?: string }>;
};

export type CertificationEngineHandle = {
  getState?: () => unknown;
  getLatestReport?: () => {
    reportId?: string;
    decision?: string;
    certificationDecision?: string;
  } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string; certificationDecision?: string }>;
};

export type QSeriesCertificationHandle = {
  getState?: () => {
    latestReport?: { certificationDecision?: string } | null;
    health?: { lastCertificationDecision?: string | null };
  };
  getLatestReport?: () => { certificationDecision?: string; reportId?: string } | null;
  getQ1113ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
  };
};

export type PostLaunchMonitoringHandle = {
  getState?: () => {
    productionActiveMonitoring?: boolean;
    latestReport?: { productionActiveMonitoring?: boolean } | null;
  };
  getLatestReport?: () => { productionActiveMonitoring?: boolean } | null;
};

export type ExecutiveAcceptancePackHandle = {
  getState?: () => { latestReport?: { decision?: string } | null };
  getLatestReport?: () => { reportId?: string; decision?: string } | null;
};

export type GrandKingAcceptanceGateHandle = {
  getState?: () => {
    grandKingDecision?: string;
    deploymentAuthorisationStatus?: string;
  };
  getGrandKingDecision?: () => string;
  getDeploymentAuthorisationStatus?: () => string;
  getLatestReport?: () => { grandKingDecision?: string; deploymentAuthorisationStatus?: string } | null;
};

export type FinancialReadinessAuditHandle = AuditEngineHandle;

export type SharedRuntimeCoreHandle = {
  getState?: () => unknown;
  listFactories?: () => Array<Record<string, unknown>>;
};

export type WorkerRegistryHandle = {
  getState?: () => unknown;
  listWorkers?: () => Array<Record<string, unknown>>;
  getWorkers?: () => Array<Record<string, unknown>>;
};

export type RuntimeHandle = {
  getState?: () => { status?: string } | unknown;
  getCatalog?: () => unknown;
  getTopology?: () => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };
};

export type QSeriesCompletionDependencies = {
  qSeriesCertification?: QSeriesCertificationHandle | null;
  productionCertificationCore?: CertificationEngineHandle | null;
  sharedRuntimeCertification?: CertificationEngineHandle | null;
  workerReadinessAudit?: AuditEngineHandle | null;
  pillowCommandAudit?: AuditEngineHandle | null;
  businessFactoryAudit?: AuditEngineHandle | null;
  securityAudit?: AuditEngineHandle | null;
  performanceAudit?: AuditEngineHandle | null;
  recoveryAudit?: AuditEngineHandle | null;
  executiveAcceptancePack?: ExecutiveAcceptancePackHandle | null;
  grandKingAcceptanceGate?: GrandKingAcceptanceGateHandle | null;
  postLaunchMonitoring?: PostLaunchMonitoringHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  auditRuntime?: RuntimeHandle | null;
  monitoringRuntime?: RuntimeHandle | null;
  recoveryRuntime?: RuntimeHandle | null;
  apiRuntime?: RuntimeHandle | null;
  /** Optional — not bound in session; record missing when absent. */
  financialReadinessAudit?: FinancialReadinessAuditHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: QSeriesCompletionDependencies = {};

  bind(deps: QSeriesCompletionDependencies = {}) {
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
      appendQscptLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  attemptQ1113ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const qscrt = this.deps.qSeriesCertification;
    if (!qscrt || typeof qscrt.getQ1113ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Q11-12 Q Series Certification not injected / getQ1113ConsumableContract unavailable",
      };
    }
    try {
      const contract = qscrt.getQ1113ConsumableContract();
      const consumed = contract?.consumerMissionId === "Q11-13";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-12 q-series-certification handshake returned explicit consumableByQ1113 contract"
          : "Injected Q11-12 q-series-certification handshake did not return explicit consumableByQ1113 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1113ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: QSeriesCompletionReport): {
    submitted: boolean;
    executiveReportId: string | null;
    details: string;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null, details: "executive_reporting_runtime_unavailable" };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: report.workerId,
      entityType: "worker",
      missionId: "Q11-13",
      currentStatus: `q_series_completion_${report.finalCompletionDecision}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      evidence: report.supportingEvidence.slice(0, 10),
      nextAction: report.finalCompletionDecision === "complete" ? "await_q1201_innovation_factory" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      qSeriesCompletionReport: report,
      neverFabricateCompletionEvidence: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId = result?.records?.find((r) => r.reportId)?.reportId ?? `ert-qscpt-${Date.now()}`;
    appendQscptLog({ event: "submit_report", details: `report=${report.reportId} executive=${executiveReportId}` });
    return { submitted: true, executiveReportId, details: "submitted_to_executive_reporting_runtime" };
  }

  private isBound(target: IntegrationTarget): boolean {
    return integrationBound(this.deps, target);
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; Q Series completion evidence only from injected handles.`;
  }
}

export function verifyIntegrations(deps: QSeriesCompletionDependencies) {
  const now = new Date().toISOString();
  const targets: IntegrationTarget[] = [
    "q_series_certification",
    "production_certification_core",
    "shared_runtime_certification",
    "worker_readiness_audit",
    "pillow_command_audit",
    "business_factory_audit",
    "security_audit",
    "performance_audit",
    "recovery_audit",
    "executive_acceptance_pack",
    "grand_king_acceptance_gate",
    "post_launch_monitoring",
    "shared_runtime_core",
    "worker_registry",
    "pillow_orchestration_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "monitoring_runtime",
    "recovery_runtime",
    "api_runtime",
  ];
  const rows = targets.map((target) => {
    const bound = integrationBound(deps, target);
    return { target, bound, evidence: bound ? `${target} handle injected` : `${target} not injected` };
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

function integrationBound(deps: QSeriesCompletionDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "q_series_certification":
      return !!deps.qSeriesCertification;
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
    case "executive_acceptance_pack":
      return !!deps.executiveAcceptancePack;
    case "grand_king_acceptance_gate":
      return !!deps.grandKingAcceptanceGate;
    case "post_launch_monitoring":
      return !!deps.postLaunchMonitoring;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "recovery_runtime":
      return !!deps.recoveryRuntime;
    case "api_runtime":
      return !!deps.apiRuntime;
    default:
      return false;
  }
}
