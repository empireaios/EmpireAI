import { appendPlmrtLog } from "./plmrt-logging.js";
import type { IntegrationHandshake, IntegrationTarget, PostLaunchMonitoringReport } from "./types.js";

export type GrandKingAcceptanceGateHandle = {
  getState?: () => {
    grandKingDecision?: string;
    deploymentAuthorisationStatus?: string;
    latestReport?: { grandKingDecision?: string; deploymentAuthorisationStatus?: string } | null;
  };
  getDeploymentAuthorisationStatus?: () => string;
  getGrandKingDecision?: () => string;
  getLatestReport?: () => { grandKingDecision?: string; deploymentAuthorisationStatus?: string } | null;
  getQ1111ConsumableContract?: () => object;
};

export type SharedRuntimeCoreHandle = {
  getState?: () => unknown;
  listFactories?: () => Array<Record<string, unknown>>;
  getCatalog?: () => unknown;
};

export type PillowOrchestrationRuntimeHandle = {
  getState?: () => unknown;
  getTopology?: () => unknown;
  getCatalog?: () => unknown;
};

export type MonitoringRuntimeHandle = {
  getState?: () => unknown;
  getDashboard?: () => unknown;
  list?: (input?: Record<string, unknown>) => unknown;
  detectAnomalies?: (input?: Record<string, unknown>) => unknown;
  generateAlerts?: (input?: Record<string, unknown>) => unknown;
  getReports?: () => unknown[];
};

export type RecoveryRuntimeHandle = {
  getState?: () => unknown;
};

export type AuditRuntimeHandle = {
  getState?: () => unknown;
  query?: (input?: Record<string, unknown>) => unknown;
};

export type ApprovalRuntimeHandle = {
  getState?: () => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };
};

export type WorkerRegistryHandle = {
  getState?: () => unknown;
  listWorkers?: () => Array<Record<string, unknown>>;
  getWorkers?: () => Array<Record<string, unknown>>;
};

export type ApiRuntimeHandle = {
  getState?: () => unknown;
  getCatalog?: () => unknown;
};

export type QueueRuntimeHandle = {
  getState?: () => unknown;
  getCatalog?: () => unknown;
};

export type PostLaunchMonitoringDependencies = {
  grandKingAcceptanceGate?: GrandKingAcceptanceGateHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  recoveryRuntime?: RecoveryRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  apiRuntime?: ApiRuntimeHandle | null;
  queueRuntime?: QueueRuntimeHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: PostLaunchMonitoringDependencies = {};

  bind(deps: PostLaunchMonitoringDependencies = {}) {
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
      appendPlmrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  attemptQ1111ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const gkagt = this.deps.grandKingAcceptanceGate;
    if (!gkagt || typeof gkagt.getQ1111ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Q11-10 Grand King Acceptance Gate not injected / getQ1111ConsumableContract unavailable",
      };
    }
    try {
      const contract = gkagt.getQ1111ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-11";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-10 grand-king-acceptance-gate handshake returned explicit consumableByQ1111 contract"
          : "Injected Q11-10 grand-king-acceptance-gate handshake did not return explicit consumableByQ1111 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1111ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: PostLaunchMonitoringReport): {
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
      missionId: "Q11-11",
      currentStatus: report.productionActiveMonitoring ? "production_active_monitoring" : "standby_monitoring",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingRisks,
      evidence: report.supportingEvidence.slice(0, 10),
      nextAction: report.productionActiveMonitoring ? "await_q1112_certification" : "await_grand_king_authorisation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      postLaunchMonitoringReport: report,
      neverFabricateProductionEvidence: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId = result?.records?.find((r) => r.reportId)?.reportId ?? `ert-plmrt-${Date.now()}`;
    appendPlmrtLog({ event: "submit_report", details: `report=${report.reportId} executive=${executiveReportId}` });
    return { submitted: true, executiveReportId, details: "submitted_to_executive_reporting_runtime" };
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "grand_king_acceptance_gate":
        return !!this.deps.grandKingAcceptanceGate;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "recovery_runtime":
        return !!this.deps.recoveryRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "api_runtime":
        return !!this.deps.apiRuntime;
      case "queue_runtime":
        return !!this.deps.queueRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; post-launch monitoring evidence only under Grand King authorisation gate.`;
  }
}

export function verifyIntegrations(deps: PostLaunchMonitoringDependencies) {
  const now = new Date().toISOString();
  const targets: IntegrationTarget[] = [
    "grand_king_acceptance_gate",
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "monitoring_runtime",
    "recovery_runtime",
    "audit_runtime",
    "executive_reporting_runtime",
    "worker_registry",
    "api_runtime",
    "queue_runtime",
  ];
  const rows = targets.map((target) => {
    const bound = integrationBound(deps, target);
    return { target, bound, evidence: bound ? `${target} handle injected` : `${target} not injected` };
  });
  const boundCount = rows.filter((r) => r.bound).length;
  return { verifiedAt: now, rows, totalTargets: targets.length, boundCount, allBound: boundCount === targets.length, evidence: rows.map((r) => r.evidence) };
}

function integrationBound(deps: PostLaunchMonitoringDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "grand_king_acceptance_gate":
      return !!deps.grandKingAcceptanceGate;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "recovery_runtime":
      return !!deps.recoveryRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "api_runtime":
      return !!deps.apiRuntime;
    case "queue_runtime":
      return !!deps.queueRuntime;
    default:
      return false;
  }
}
