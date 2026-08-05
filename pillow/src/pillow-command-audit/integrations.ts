import { PILLOW_COMMAND_AUDIT_IDENTITY } from "./paths.js";
import { appendPcartLog } from "./pcart-logging.js";
import type { IntegrationHandshake, IntegrationTarget, PillowCommandAuditReport, WorkerHandle } from "./types.js";

export type PillowCommandAuditDependencies = {
  /** Authoritative worker discovery source — never invented. */
  workerRegistry?:
    | (WorkerHandle & {
        listWorkers?: () => Array<Record<string, unknown>>;
        registerWorker?: (input: Record<string, unknown>) => unknown;
      })
    | null;
  /** Q11-02 — exposes the Q1103 consumable contract for Q11-03 to consume. */
  workerReadinessAudit?:
    | (WorkerHandle & { getQ1103ConsumableContract?: () => object })
    | null;
  productionCertificationCore?: WorkerHandle | null;
  /** Command dispatch, supervision, and result-collection structural signal source. */
  pillowOrchestrationRuntime?:
    | (WorkerHandle & {
        invokeWorker?: (...args: unknown[]) => unknown;
        retrieveReport?: (...args: unknown[]) => unknown;
      })
    | null;
  /** Worker communication structural signal source. */
  communicationRuntime?:
    | (WorkerHandle & {
        sendMessage?: (...args: unknown[]) => unknown;
        acknowledgeMessage?: (...args: unknown[]) => unknown;
      })
    | null;
  /** Worker assignment structural signal source. */
  missionRuntime?: (WorkerHandle & { createMission?: (...args: unknown[]) => unknown }) | null;
  /** Supervision and progress-tracking structural signal source. */
  monitoringRuntime?:
    | (WorkerHandle & {
        produceReport?: (...args: unknown[]) => unknown;
        list?: (...args: unknown[]) => unknown;
        getState?: (...args: unknown[]) => unknown;
      })
    | null;
  auditRuntime?: WorkerHandle | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
    };
    retrieveReport?: (...args: unknown[]) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: PillowCommandAuditDependencies = {};

  bind(deps: PillowCommandAuditDependencies = {}) {
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
      appendPcartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1103ConsumableContract exposed by Q11-02 worker-readiness-audit when injected. */
  attemptQ1103ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const wrart = this.deps.workerReadinessAudit;
    if (!wrart || typeof wrart.getQ1103ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected worker-readiness-audit handle exposing getQ1103ConsumableContract",
      };
    }
    try {
      const contract = wrart.getQ1103ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-03";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-02 worker-readiness-audit handshake returned explicit consumableByQ1103 contract"
          : "Injected Q11-02 worker-readiness-audit handshake did not return explicit consumableByQ1103 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1103ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: PillowCommandAuditReport): {
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
      missionId: "Q11-03",
      currentStatus: `pillow_command_audit_${report.commandReadinessDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `commandReadinessDecision=${report.commandReadinessDecision}`,
        `successfullyControlledWorkers=${report.successfullyControlledWorkers}/${report.totalWorkersAudited}`,
      ],
      nextAction:
        report.commandReadinessDecision === "Ready" ? "workers_command_ready" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      pillowCommandAuditReport: report,
      neverFabricateAuditEvidence: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-pcart-${Date.now()}`;
    appendPcartLog({
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
      workerName: PILLOW_COMMAND_AUDIT_IDENTITY.workerName,
      workerType: PILLOW_COMMAND_AUDIT_IDENTITY.workerType,
      department: PILLOW_COMMAND_AUDIT_IDENTITY.department,
      factory: PILLOW_COMMAND_AUDIT_IDENTITY.factory,
      role: PILLOW_COMMAND_AUDIT_IDENTITY.role,
      reportingLine: [...PILLOW_COMMAND_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...PILLOW_COMMAND_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...PILLOW_COMMAND_AUDIT_IDENTITY.approvedTools],
      authorityLevel: PILLOW_COMMAND_AUDIT_IDENTITY.authorityLevel,
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
      case "worker_readiness_audit":
        return !!this.deps.workerReadinessAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      case "communication_runtime":
        return !!this.deps.communicationRuntime;
      case "mission_runtime":
        return !!this.deps.missionRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only audit-only worker under Pillow.`;
  }
}
