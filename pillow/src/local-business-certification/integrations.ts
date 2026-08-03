import { Q7_MISSIONS } from "./mission-catalog.js";
import { LOCAL_BUSINESS_CERTIFICATION_IDENTITY } from "./paths.js";
import { appendLbcLog } from "./lbc-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  LocalBusinessCertificationReport,
  WorkerHandle,
} from "./types.js";

/** Q7-01..Q7-10 worker handles, keyed exactly by their session.ts dependencyKey. */
export type Q7WorkerDependencies = {
  localBusinessFactoryCore?: WorkerHandle | null;
  localMarketResearchWorker?: WorkerHandle | null;
  serviceOfferWorker?: WorkerHandle | null;
  bookingWorker?: WorkerHandle | null;
  crmWorker?: WorkerHandle | null;
  whatsAppWorker?: WorkerHandle | null;
  localSeoWorker?: WorkerHandle | null;
  leadGenerationWorker?: WorkerHandle | null;
  operationsWorker?: WorkerHandle | null;
  /** Q7-10 — additionally exposes the Q7-11 consumable contract handshake. */
  localBusinessLaunchPack?:
    | (WorkerHandle & { getQ711ConsumableContract?: () => object })
    | null;
};

/** Optional live workforce/governance integrations for Q7-11 Local Business Certification. */
export type LocalBusinessCertificationDependencies = Q7WorkerDependencies & {
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
  private deps: LocalBusinessCertificationDependencies = {};

  bind(deps: LocalBusinessCertificationDependencies = {}) {
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
    return new Map(Q7_MISSIONS.map((m) => [m.missionId, this.getWorkerHandle(m.dependencyKey)]));
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
      appendLbcLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptLaunchPackContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const launchPack = this.deps.localBusinessLaunchPack;
    if (!launchPack || typeof launchPack.getQ711ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected local-business-launch-pack handle exposing getQ711ConsumableContract",
      };
    }
    try {
      const contract = launchPack.getQ711ConsumableContract() as {
        contractVersion?: string;
        fields?: readonly string[];
        consumableByQ711?: boolean;
      };
      const consumed = contract?.consumableByQ711 === true;
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.fields ?? [])],
        evidence: consumed
          ? "Injected Q7-10 launch pack handshake returned an explicit consumableByQ711 contract"
          : "Injected Q7-10 launch pack handshake did not return an explicit consumableByQ711 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ711ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: LocalBusinessCertificationReport): {
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
      missionId: "Q7-11",
      currentStatus: `local_business_certification_${report.certificationDecision.toLowerCase()}`,
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
      localBusinessCertificationReport: report,
      neverFabricateVerificationResults: true,
      neverCertifyUnsupportedFunctionality: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lbc-${Date.now()}`;
    appendLbcLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.auditRuntime?.recordAuditEvent?.({
        kind: "local_business_certification_report",
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
      workerName: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.workerName,
      workerType: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.workerType,
      department: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.department,
      factory: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.factory,
      role: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.role,
      reportingLine: [...LOCAL_BUSINESS_CERTIFICATION_IDENTITY.reportingLine],
      skillProfile: [...LOCAL_BUSINESS_CERTIFICATION_IDENTITY.skillProfile],
      approvedTools: [...LOCAL_BUSINESS_CERTIFICATION_IDENTITY.approvedTools],
      authorityLevel: LOCAL_BUSINESS_CERTIFICATION_IDENTITY.authorityLevel,
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
      Q7_MISSIONS.map((m) => [m.subsystemId, m.dependencyKey]),
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
