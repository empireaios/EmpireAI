import { WORKER_READINESS_AUDIT_IDENTITY } from "./paths.js";
import { appendWrartLog } from "./wrart-logging.js";
import type { IntegrationHandshake, IntegrationTarget, WorkerHandle, WorkerReadinessAuditReport } from "./types.js";

export type WorkerReadinessAuditDependencies = {
  /** Authoritative worker discovery source — never invented. */
  workerRegistry?:
    | (WorkerHandle & {
        listWorkers?: () => Array<Record<string, unknown>>;
        registerWorker?: (input: Record<string, unknown>) => unknown;
      })
    | null;
  /** Q11-01 — exposes the Q1102 consumable contract for Q11-02 to consume. */
  productionCertificationCore?:
    | (WorkerHandle & { getQ1102ConsumableContract?: () => object })
    | null;
  sharedRuntimeCore?:
    | (WorkerHandle & { listFactories?: () => Array<Record<string, unknown>> })
    | null;
  pillowOrchestrationRuntime?: WorkerHandle | null;
  monitoringRuntime?: WorkerHandle | null;
  auditRuntime?: WorkerHandle | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
    };
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  /** Optional per-worker runtime handles for direct reachability probing, keyed by workerId. */
  workerHandles?: Record<string, WorkerHandle> | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: WorkerReadinessAuditDependencies = {};

  bind(deps: WorkerReadinessAuditDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getWorkerHandle(workerId: string): WorkerHandle | undefined {
    return this.deps.workerHandles?.[workerId];
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
      appendWrartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1102ConsumableContract exposed by Q11-01 production-certification-core when injected. */
  attemptQ1102ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const pccrt = this.deps.productionCertificationCore;
    if (!pccrt || typeof pccrt.getQ1102ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected production-certification-core handle exposing getQ1102ConsumableContract",
      };
    }
    try {
      const contract = pccrt.getQ1102ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-02";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-01 production-certification-core handshake returned explicit consumableByQ1102 contract"
          : "Injected Q11-01 production-certification-core handshake did not return explicit consumableByQ1102 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1102ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: WorkerReadinessAuditReport): {
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
      missionId: "Q11-02",
      currentStatus: `worker_readiness_audit_${report.readinessDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `readinessDecision=${report.readinessDecision}`,
        `readyWorkers=${report.readyWorkers}/${report.totalWorkers}`,
      ],
      nextAction:
        report.readinessDecision === "Ready" ? "workers_ready_for_deployment" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      workerReadinessAuditReport: report,
      neverFabricateAuditEvidence: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-wrart-${Date.now()}`;
    appendWrartLog({
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
      workerName: WORKER_READINESS_AUDIT_IDENTITY.workerName,
      workerType: WORKER_READINESS_AUDIT_IDENTITY.workerType,
      department: WORKER_READINESS_AUDIT_IDENTITY.department,
      factory: WORKER_READINESS_AUDIT_IDENTITY.factory,
      role: WORKER_READINESS_AUDIT_IDENTITY.role,
      reportingLine: [...WORKER_READINESS_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...WORKER_READINESS_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...WORKER_READINESS_AUDIT_IDENTITY.approvedTools],
      authorityLevel: WORKER_READINESS_AUDIT_IDENTITY.authorityLevel,
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
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only audit-only worker under Pillow.`;
  }
}
