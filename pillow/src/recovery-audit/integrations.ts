import { RECOVERY_AUDIT_IDENTITY } from "./paths.js";
import { appendRecartLog } from "./recart-logging.js";
import type { RecoveryAuditReport, RecoveryHandle, IntegrationHandshake, IntegrationTarget } from "./types.js";

/** Q11-06 — exposes Q1107 consumable contract for Q11-07 to consume. */
export type PerformanceAuditHandle = RecoveryHandle & {
  getState?: () => unknown;
  getQ1107ConsumableContract?: () => object;
};

export type RecoveryRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
  detectFailure?: (...args: unknown[]) => unknown;
  restoreState?: (...args: unknown[]) => unknown;
  restartJob?: (...args: unknown[]) => unknown;
  resumeWorkflow?: (...args: unknown[]) => unknown;
  rollback?: (...args: unknown[]) => unknown;
};

export type ProductionCertificationCoreHandle = RecoveryHandle & {
  getState?: () => unknown;
  getCertificationResults?: () => unknown;
};

export type SharedRuntimeCoreHandle = RecoveryHandle & {
  getState?: () => unknown;
  getCatalog?: () => unknown;
};

export type MonitoringRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
  getDashboard?: () => unknown;
};

export type AuditRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
  query?: (input?: Record<string, unknown>) => unknown;
};

export type QueueRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
};

export type MissionRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
  resume?: (...args: unknown[]) => unknown;
  recover?: (...args: unknown[]) => unknown;
  getCheckpoints?: (...args: unknown[]) => unknown;
};

export type WorkerRegistryHandle = RecoveryHandle & {
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

export type PillowOrchestrationRuntimeHandle = RecoveryHandle & {
  getState?: () => unknown;
  invokeWorkflow?: (...args: unknown[]) => unknown;
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type WorkerRecoverySystemHandle = RecoveryHandle & {
  getState?: () => unknown;
  recoverWorker?: (...args: unknown[]) => unknown;
};

export type RecoveryManagerHandle = RecoveryHandle & {
  getState?: () => unknown;
  manageRecovery?: (...args: unknown[]) => unknown;
};

export type RollbackManagerHandle = RecoveryHandle & {
  getState?: () => unknown;
  rollback?: (...args: unknown[]) => unknown;
};

export type WorkerLifecycleHandle = {
  createWorker: (input: Record<string, unknown>) => unknown;
  activateWorker: (input: Record<string, unknown>) => unknown;
};

export type RecoveryAuditDependencies = {
  performanceAudit?: PerformanceAuditHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  recoveryRuntime?: RecoveryRuntimeHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  queueRuntime?: QueueRuntimeHandle | null;
  missionRuntime?: MissionRuntimeHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle | null;
  workerRecoverySystem?: WorkerRecoverySystemHandle | null;
  recoveryManager?: RecoveryManagerHandle | null;
  rollbackManager?: RollbackManagerHandle | null;
  workerLifecycle?: WorkerLifecycleHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: RecoveryAuditDependencies = {};

  bind(deps: RecoveryAuditDependencies = {}) {
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
      appendRecartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptQ1107ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const perfart = this.deps.performanceAudit;
    if (!perfart || typeof perfart.getQ1107ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected performance-audit handle exposing getQ1107ConsumableContract",
      };
    }
    try {
      const contract = perfart.getQ1107ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-07";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-06 performance-audit handshake returned explicit consumableByQ1107 contract"
          : "Injected Q11-06 performance-audit handshake did not return explicit consumableByQ1107 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1107ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: RecoveryAuditReport): {
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
      missionId: "Q11-07",
      currentStatus: `recovery_audit_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingRisks,
      risks: report.outstandingRisks,
      evidence: [
        `decision=${report.decision}`,
        `certifiedComponents=${report.certifiedComponents}/${report.totalRecoveryComponents}`,
      ],
      nextAction: report.decision === "certify" ? "recovery_components_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      recoveryAuditReport: report,
      neverFabricateRecoveryEvidence: true,
      neverMutateProductionViaRecoveryCalls: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-recart-${Date.now()}`;
    appendRecartLog({
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
      workerName: RECOVERY_AUDIT_IDENTITY.workerName,
      workerType: RECOVERY_AUDIT_IDENTITY.workerType,
      department: RECOVERY_AUDIT_IDENTITY.department,
      factory: RECOVERY_AUDIT_IDENTITY.factory,
      role: RECOVERY_AUDIT_IDENTITY.role,
      reportingLine: [...RECOVERY_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...RECOVERY_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...RECOVERY_AUDIT_IDENTITY.approvedTools],
      authorityLevel: RECOVERY_AUDIT_IDENTITY.authorityLevel,
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
      case "performance_audit":
        return !!this.deps.performanceAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "recovery_runtime":
        return !!this.deps.recoveryRuntime;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "queue_runtime":
        return !!this.deps.queueRuntime;
      case "mission_runtime":
        return !!this.deps.missionRuntime;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only audit-only worker under Pillow.`;
  }
}
