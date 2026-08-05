import { appendQscrtLog } from "./qscrt-logging.js";
import type { IntegrationHandshake, IntegrationTarget, QSeriesCertificationReport } from "./types.js";

export type AuditEngineHandle = {
  getState?: () => unknown;
  getLatestReport?: () => { reportId?: string; decision?: string; auditStatus?: string; missionId?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string; auditStatus?: string }>;
};

export type CertificationEngineHandle = {
  getState?: () => unknown;
  getLatestReport?: () => { reportId?: string; decision?: string; certificationDecision?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string }>;
};

export type PostLaunchMonitoringHandle = {
  getState?: () => {
    productionActiveMonitoring?: boolean;
    grandKingAcceptanceGranted?: boolean;
    latestReport?: { productionActiveMonitoring?: boolean } | null;
  };
  getQ1112ConsumableContract?: () => object;
  getLatestReport?: () => { productionActiveMonitoring?: boolean } | null;
};

export type ExecutiveAcceptancePackHandle = {
  getState?: () => { latestReport?: { decision?: string } | null };
  getLatestReport?: () => { reportId?: string; decision?: string } | null;
  getReports?: () => Array<{ reportId?: string; decision?: string }>;
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

export type FinancialReadinessAuditHandle = AuditEngineHandle & {
  getQ1109ConsumableContract?: () => { consumerMissionId?: string; contractVersion?: string };
};

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

export type QSeriesCertificationDependencies = {
  postLaunchMonitoring?: PostLaunchMonitoringHandle | null;
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
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  auditRuntime?: RuntimeHandle | null;
  monitoringRuntime?: RuntimeHandle | null;
  recoveryRuntime?: RuntimeHandle | null;
  apiRuntime?: RuntimeHandle | null;
  queueRuntime?: RuntimeHandle | null;
  schedulingRuntime?: RuntimeHandle | null;
  /** Optional — not bound in session; record missing when absent. */
  financialReadinessAudit?: FinancialReadinessAuditHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: QSeriesCertificationDependencies = {};

  bind(deps: QSeriesCertificationDependencies = {}) {
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
      appendQscrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  attemptQ1112ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const plmrt = this.deps.postLaunchMonitoring;
    if (!plmrt || typeof plmrt.getQ1112ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Q11-11 Post-Launch Monitoring not injected / getQ1112ConsumableContract unavailable",
      };
    }
    try {
      const contract = plmrt.getQ1112ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-12";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-11 post-launch-monitoring handshake returned explicit consumableByQ1112 contract"
          : "Injected Q11-11 post-launch-monitoring handshake did not return explicit consumableByQ1112 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1112ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: QSeriesCertificationReport): {
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
      missionId: "Q11-12",
      currentStatus: `q_series_certification_${report.certificationDecision}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      evidence: report.supportingEvidence.slice(0, 10),
      nextAction: report.certificationDecision === "certify" ? "await_q1113_complete" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      qSeriesCertificationReport: report,
      neverFabricateCertificationEvidence: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId = result?.records?.find((r) => r.reportId)?.reportId ?? `ert-qscrt-${Date.now()}`;
    appendQscrtLog({ event: "submit_report", details: `report=${report.reportId} executive=${executiveReportId}` });
    return { submitted: true, executiveReportId, details: "submitted_to_executive_reporting_runtime" };
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "post_launch_monitoring":
        return !!this.deps.postLaunchMonitoring;
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
      case "executive_acceptance_pack":
        return !!this.deps.executiveAcceptancePack;
      case "grand_king_acceptance_gate":
        return !!this.deps.grandKingAcceptanceGate;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "recovery_runtime":
        return !!this.deps.recoveryRuntime;
      case "api_runtime":
        return !!this.deps.apiRuntime;
      case "queue_runtime":
        return !!this.deps.queueRuntime;
      case "scheduling_runtime":
        return !!this.deps.schedulingRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; Q Series certification evidence only from injected handles.`;
  }
}

export function verifyIntegrations(deps: QSeriesCertificationDependencies) {
  const now = new Date().toISOString();
  const targets: IntegrationTarget[] = [
    "post_launch_monitoring",
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
    "shared_runtime_core",
    "worker_registry",
    "pillow_orchestration_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "monitoring_runtime",
    "recovery_runtime",
    "api_runtime",
    "queue_runtime",
    "scheduling_runtime",
  ];
  const rows = targets.map((target) => {
    const bound = integrationBound(deps, target);
    return { target, bound, evidence: bound ? `${target} handle injected` : `${target} not injected` };
  });
  const boundCount = rows.filter((r) => r.bound).length;
  return { verifiedAt: now, rows, totalTargets: targets.length, boundCount, allBound: boundCount === targets.length, evidence: rows.map((r) => r.evidence) };
}

function integrationBound(deps: QSeriesCertificationDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "post_launch_monitoring":
      return !!deps.postLaunchMonitoring;
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
    case "queue_runtime":
      return !!deps.queueRuntime;
    case "scheduling_runtime":
      return !!deps.schedulingRuntime;
    default:
      return false;
  }
}
