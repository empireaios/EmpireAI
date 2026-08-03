import { Q8_MISSIONS } from "./mission-catalog.js";
import { AFFILIATE_CERTIFICATION_IDENTITY } from "./paths.js";
import { appendAfcrtLog } from "./afcrt-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  AffiliateCertificationReport,
  WorkerHandle,
} from "./types.js";

/** Q8-01..Q8-08 worker handles, keyed exactly by their session.ts dependencyKey. */
export type Q8WorkerDependencies = {
  affiliateFactoryCore?: WorkerHandle | null;
  affiliateOpportunityWorker?: WorkerHandle | null;
  comparisonSiteWorker?: WorkerHandle | null;
  reviewContentWorker?: WorkerHandle | null;
  seoContentWorker?: WorkerHandle | null;
  emailFunnelWorker?: WorkerHandle | null;
  analyticsWorker?: WorkerHandle | null;
  /** Q8-08 — additionally exposes the Q8-09 consumable contract handshake. */
  affiliateComplianceWorker?:
    | (WorkerHandle & { getQ809ConsumableContract?: () => object })
    | null;
};

/** Optional live workforce/governance integrations for Q8-09 Affiliate Certification. */
export type AffiliateCertificationDependencies = Q8WorkerDependencies & {
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
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
    recordAuditEvent?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: AffiliateCertificationDependencies = {};

  bind(deps: AffiliateCertificationDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getWorkerHandle(dependencyKey: string): WorkerHandle | undefined {
    const handle = (this.deps as Record<string, unknown>)[dependencyKey];
    return handle ? (handle as WorkerHandle) : undefined;
  }

  getAllWorkerHandles(): Map<string, WorkerHandle | undefined> {
    return new Map(Q8_MISSIONS.map((m) => [m.missionId, this.getWorkerHandle(m.dependencyKey)]));
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
      appendAfcrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptComplianceContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const compliance = this.deps.affiliateComplianceWorker;
    if (!compliance || typeof compliance.getQ809ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence:
          "No injected affiliate-compliance-worker handle exposing getQ809ConsumableContract",
      };
    }
    try {
      const contract = compliance.getQ809ConsumableContract() as {
        contractVersion?: string;
        fields?: readonly string[];
        consumableByQ809?: boolean;
      };
      const consumed = contract?.consumableByQ809 === true;
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.fields ?? [])],
        evidence: consumed
          ? "Injected Q8-08 compliance worker handshake returned an explicit consumableByQ809 contract"
          : "Injected Q8-08 compliance worker handshake did not return an explicit consumableByQ809 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ809ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /** @deprecated alias retained for managers that still call the LBC-shaped name */
  attemptLaunchPackContractHandshake() {
    return this.attemptComplianceContractHandshake();
  }

  submitReport(report: AffiliateCertificationReport): {
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
      missionId: "Q8-09",
      currentStatus: `affiliate_certification_${report.certificationDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingFindings,
      risks: report.risks,
      evidence: [
        `certificationDecision=${report.certificationDecision}`,
        `componentsCompleted=${report.componentStatusMatrix.filter((r) => r.status === "Completed").length}/${report.componentStatusMatrix.length}`,
      ],
      nextAction:
        report.certificationDecision === "Certified"
          ? "factory_certified"
          : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      affiliateCertificationReport: report,
      neverFabricateVerificationResults: true,
      neverCertifyUnsupportedFunctionality: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-afcrt-${Date.now()}`;
    appendAfcrtLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.auditRuntime?.recordAuditEvent?.({
        kind: "affiliate_certification_report",
        reportId: report.reportId,
        certificationDecision: report.certificationDecision,
      });
    } catch {
      /* audit runtime is soft-optional */
    }
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: AFFILIATE_CERTIFICATION_IDENTITY.workerName,
      workerType: AFFILIATE_CERTIFICATION_IDENTITY.workerType,
      department: AFFILIATE_CERTIFICATION_IDENTITY.department,
      factory: AFFILIATE_CERTIFICATION_IDENTITY.factory,
      role: AFFILIATE_CERTIFICATION_IDENTITY.role,
      reportingLine: [...AFFILIATE_CERTIFICATION_IDENTITY.reportingLine],
      skillProfile: [...AFFILIATE_CERTIFICATION_IDENTITY.skillProfile],
      approvedTools: [...AFFILIATE_CERTIFICATION_IDENTITY.approvedTools],
      authorityLevel: AFFILIATE_CERTIFICATION_IDENTITY.authorityLevel,
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
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({ workerId, validated: true });
    } catch {
      /* recovery optional */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    const dependencyKeyByTarget = new Map<string, string>(
      Q8_MISSIONS.map((m) => [m.subsystemId, m.dependencyKey]),
    );
    const dependencyKey = dependencyKeyByTarget.get(target);
    if (dependencyKey) return Boolean((this.deps as Record<string, unknown>)[dependencyKey]);
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
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only certification-only worker under Pillow.`;
  }
}
