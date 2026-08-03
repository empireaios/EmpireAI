import { AFFILIATE_FACTORY_CORE_IDENTITY } from "./paths.js";
import type {
  AffiliateBusinessProject,
  AffiliateFactoryReport,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendAfcLog } from "./afc-logging.js";

/**
 * Optional live integrations for Q8-01 Affiliate Factory Core.
 * Deliberately excludes any Q8-02+ specialist worker dependencies (opportunity discovery,
 * content generation, etc.) — this module orchestrates structural role slots only.
 */
export type AffiliateFactoryCoreDependencies = {
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    registerWorker?: (input: Record<string, unknown>) => unknown;
    activateWorker?: (input: Record<string, unknown>) => unknown;
  } | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
    };
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  auditRuntime?: {
    recordAuditEntry?: (input: Record<string, unknown>) => { accepted?: boolean } | void;
  } | null;
  missionRuntime?: {
    registerProjectMission?: (input: Record<string, unknown>) => unknown;
  } | null;
  queueRuntime?: {
    enqueueWorkerTask?: (input: Record<string, unknown>) => unknown;
  } | null;
  memoryRuntime?: {
    recordMemory?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class AfcIntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: AffiliateFactoryCoreDependencies = {};

  bind(deps: AffiliateFactoryCoreDependencies = {}) {
    this.deps = { ...deps };
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
      appendAfcLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Structural role-slot coordination only — never assigns live Q8-02+ specialist workers. */
  coordinateWorkers(
    project: AffiliateBusinessProject,
    requestedRoles: string[],
    requestedWorkers: string[],
  ): { details: string } {
    try {
      this.deps.queueRuntime?.enqueueWorkerTask?.({
        affiliateBusinessId: project.affiliateBusinessId,
        requestedRoles,
        requestedWorkers,
        validated: true,
      });
    } catch {
      /* optional */
    }
    try {
      this.deps.missionRuntime?.registerProjectMission?.({
        affiliateBusinessId: project.affiliateBusinessId,
        factoryProjectId: project.factoryProjectId,
        validated: true,
      });
    } catch {
      /* optional */
    }
    appendAfcLog({
      event: "coordinate_workers",
      details: `business=${project.affiliateBusinessId} roles=${requestedRoles.length}`,
    });
    return { details: "coordinated_structural_role_slots" };
  }

  recordAudit(report: AffiliateFactoryReport): { audited: boolean; details: string } {
    const runtime = this.deps.auditRuntime;
    if (!runtime?.recordAuditEntry) {
      return { audited: false, details: "audit_runtime_unavailable" };
    }
    try {
      const result = runtime.recordAuditEntry({
        reportId: report.reportId,
        affiliateBusinessId: report.affiliateBusinessId,
        lifecycleStatus: report.lifecycleStatus,
        traceabilityRefs: [...report.traceabilityRefs],
        validated: true,
      });
      const accepted = typeof result === "object" && result !== null ? result.accepted !== false : true;
      appendAfcLog({
        event: "record_audit",
        details: `business=${report.affiliateBusinessId} accepted=${accepted}`,
      });
      return { audited: accepted, details: accepted ? "audit_recorded" : "audit_rejected" };
    } catch {
      return { audited: false, details: "audit_runtime_failed" };
    }
  }

  recordMemory(report: AffiliateFactoryReport): void {
    try {
      this.deps.memoryRuntime?.recordMemory?.({
        affiliateBusinessId: report.affiliateBusinessId,
        lifecycleStatus: report.lifecycleStatus,
        confidenceScore: report.confidenceScore,
        validated: true,
      });
    } catch {
      /* optional */
    }
  }

  submitReport(report: AffiliateFactoryReport): {
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
      businessId: report.affiliateBusinessId,
      missionId: "Q8-01",
      currentStatus: report.lifecycleStatus,
      progress: report.progressSummary.percentComplete,
      blockers: [...report.outstandingTasks],
      risks: [...report.risks],
      evidence: [
        ...report.traceabilityRefs,
        `business_category=${report.businessCategory}`,
        `readiness_status=${report.readinessStatus}`,
        `confidence_score=${report.confidenceScore}`,
        `audit_status=${report.auditStatus}`,
      ],
      nextAction: "await_downstream_affiliate_workers",
      completionStatus: report.lifecycleStatus === "completed" ? "completed" : "in_progress",
      reportType: "worker",
      validated: true,
      affiliateFactoryReport: report,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-afc-${Date.now()}`;
    appendAfcLog({
      event: "submit_report",
      details: `business=${report.affiliateBusinessId} executive=${executiveReportId}`,
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
      workerName: AFFILIATE_FACTORY_CORE_IDENTITY.workerName,
      workerType: AFFILIATE_FACTORY_CORE_IDENTITY.workerType,
      department: AFFILIATE_FACTORY_CORE_IDENTITY.department,
      factory: AFFILIATE_FACTORY_CORE_IDENTITY.factory,
      role: AFFILIATE_FACTORY_CORE_IDENTITY.role,
      reportingLine: [...AFFILIATE_FACTORY_CORE_IDENTITY.reportingLine],
      skillProfile: [...AFFILIATE_FACTORY_CORE_IDENTITY.skillProfile],
      approvedTools: [...AFFILIATE_FACTORY_CORE_IDENTITY.approvedTools],
      authorityLevel: AFFILIATE_FACTORY_CORE_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };

    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* optional */
    }
    try {
      this.deps.workerLifecycle?.registerWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({ workerId, validated: true });
    } catch {
      /* optional */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "mission_runtime":
        return !!this.deps.missionRuntime;
      case "queue_runtime":
        return !!this.deps.queueRuntime;
      case "memory_runtime":
        return !!this.deps.memoryRuntime;
      case "affiliate_factory_core_validation":
        return true;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; orchestration-only affiliate factory core under Pillow.`;
  }
}
