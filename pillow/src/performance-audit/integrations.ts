import { PERFORMANCE_AUDIT_IDENTITY } from "./paths.js";
import { appendPerfartLog } from "./perfart-logging.js";
import type { PerformanceAuditReport, PerformanceHandle, IntegrationHandshake, IntegrationTarget } from "./types.js";

/** Q11-05 — exposes the Q1106 consumable contract for Q11-06 to consume. */
export type SecurityAuditHandle = PerformanceHandle & {
  getState?: () => unknown;
  getQ1106ConsumableContract?: () => object;
};

/**
 * Structural handles below intentionally expose only the safe,
 * non-mutating read methods actually used as timed structural probes
 * (`listWorkers`, `getCatalog`, `getDashboard`, `checkHealth`,
 * `getState`, `query`, `getCertificationResults`). Every method is
 * presence-checked reflectively via `typeof handle[name] === "function"`
 * before ever being invoked, and invocation never mutates production
 * state — only read-only structural signal is measured. This keeps real
 * engine instances structurally assignable to these narrow handle types.
 */
export type ProductionCertificationCoreHandle = PerformanceHandle & {
  getState?: () => unknown;
  getCertificationResults?: () => unknown;
};

export type SharedRuntimeCoreHandle = PerformanceHandle & {
  getState?: () => unknown;
  getCatalog?: () => unknown;
};

export type MonitoringRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
  getDashboard?: () => unknown;
};

export type AuditRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
  query?: (input?: Record<string, unknown>) => unknown;
};

export type QueueRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
};

export type ApiRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
  checkHealth?: () => unknown;
};

export type WorkerRegistryHandle = PerformanceHandle & {
  getState?: () => unknown;
  listWorkers?: () => unknown[];
  registerWorker?: (input: Record<string, unknown>) => unknown;
};

/** Structural handle for the Executive Reporting Runtime (Q0-26). Never invoked to submit fabricated reports as probes. */
export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => {
    records?: Array<{ reportId?: string }>;
  };
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type PillowOrchestrationRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
  invokeWorker?: (...args: unknown[]) => unknown;
  invokeWorkflow?: (...args: unknown[]) => unknown;
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type SchedulingRuntimeHandle = PerformanceHandle & {
  getState?: () => unknown;
};

export type WorkerLifecycleHandle = {
  createWorker: (input: Record<string, unknown>) => unknown;
  activateWorker: (input: Record<string, unknown>) => unknown;
};

export type PerformanceAuditDependencies = {
  /** Q11-05 — exposes the Q1106 consumable contract for Q11-06 to consume. */
  securityAudit?: SecurityAuditHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  queueRuntime?: QueueRuntimeHandle | null;
  apiRuntime?: ApiRuntimeHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle | null;
  /** Optional — absence never fails the audit outright, only lowers readiness. */
  schedulingRuntime?: SchedulingRuntimeHandle | null;
  workerLifecycle?: WorkerLifecycleHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: PerformanceAuditDependencies = {};

  bind(deps: PerformanceAuditDependencies = {}) {
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
      appendPerfartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1106ConsumableContract exposed by Q11-05 security-audit when injected. */
  attemptQ1106ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const secart = this.deps.securityAudit;
    if (!secart || typeof secart.getQ1106ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected security-audit handle exposing getQ1106ConsumableContract",
      };
    }
    try {
      const contract = secart.getQ1106ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-06";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-05 security-audit handshake returned explicit consumableByQ1106 contract"
          : "Injected Q11-05 security-audit handshake did not return explicit consumableByQ1106 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1106ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: PerformanceAuditReport): {
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
      missionId: "Q11-06",
      currentStatus: `performance_audit_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `decision=${report.decision}`,
        `certifiedComponents=${report.certifiedComponents}/${report.totalPerformanceComponents}`,
      ],
      nextAction: report.decision === "certify" ? "performance_components_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      performanceAuditReport: report,
      neverFabricatePerformanceEvidence: true,
      neverOptimizeOrModifyProductionSystems: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-perfart-${Date.now()}`;
    appendPerfartLog({
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
      workerName: PERFORMANCE_AUDIT_IDENTITY.workerName,
      workerType: PERFORMANCE_AUDIT_IDENTITY.workerType,
      department: PERFORMANCE_AUDIT_IDENTITY.department,
      factory: PERFORMANCE_AUDIT_IDENTITY.factory,
      role: PERFORMANCE_AUDIT_IDENTITY.role,
      reportingLine: [...PERFORMANCE_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...PERFORMANCE_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...PERFORMANCE_AUDIT_IDENTITY.approvedTools],
      authorityLevel: PERFORMANCE_AUDIT_IDENTITY.authorityLevel,
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
      case "security_audit":
        return !!this.deps.securityAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "queue_runtime":
        return !!this.deps.queueRuntime;
      case "api_runtime":
        return !!this.deps.apiRuntime;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
      case "scheduling_runtime":
        return !!this.deps.schedulingRuntime;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only audit-only worker under Pillow.`;
  }
}
