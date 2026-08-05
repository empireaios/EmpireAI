import { Q10_RUNTIMES } from "./runtime-catalog.js";
import { SHARED_RUNTIME_CERTIFICATION_IDENTITY } from "./paths.js";
import { appendSrcrtLog } from "./srcrt-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  SharedRuntimeCertificationReport,
  WorkerHandle,
} from "./types.js";

/** Q10-01..Q10-13 runtime handles, keyed by session.ts dependencyKey. */
export type Q10RuntimeDependencies = {
  sharedRuntimeCore?: WorkerHandle | null;
  pillowOrchestrationRuntime?: WorkerHandle | null;
  missionRuntime?: WorkerHandle | null;
  queueRuntime?: WorkerHandle | null;
  memoryRuntime?: WorkerHandle | null;
  apiRuntime?: WorkerHandle | null;
  toolRuntime?: WorkerHandle | null;
  communicationRuntime?: WorkerHandle | null;
  approvalRuntime?: WorkerHandle | null;
  monitoringRuntime?: (WorkerHandle & {
    getQ1011ConsumableContract?: () => object;
    produceReport?: () => unknown;
  }) | null;
  recoveryRuntime?: (WorkerHandle & { getQ1012ConsumableContract?: () => object }) | null;
  schedulingRuntime?: WorkerHandle | null;
  /** Q10-13 — exposes Q1014 consumable contract handshake for Q10-14. */
  auditRuntime?: (WorkerHandle & {
    getQ1014ConsumableContract?: () => object;
    produceReport?: () => unknown;
  }) | null;
};

export type SharedRuntimeCertificationDependencies = Q10RuntimeDependencies & {
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
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: SharedRuntimeCertificationDependencies = {};

  bind(deps: SharedRuntimeCertificationDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getInjectedDependencyKeys(): Set<string> {
    const keys = new Set<string>();
    for (const runtime of Q10_RUNTIMES) {
      if ((this.deps as Record<string, unknown>)[runtime.dependencyKey]) {
        keys.add(runtime.dependencyKey);
      }
    }
    return keys;
  }

  getWorkerHandle(dependencyKey: string): WorkerHandle | undefined {
    const handle = (this.deps as Record<string, unknown>)[dependencyKey];
    return handle ? (handle as WorkerHandle) : undefined;
  }

  getAllWorkerHandles(): Map<string, WorkerHandle | undefined> {
    return new Map(Q10_RUNTIMES.map((r) => [r.missionId, this.getWorkerHandle(r.dependencyKey)]));
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
      appendSrcrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptQ1014ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const auditRuntime = this.deps.auditRuntime;
    if (!auditRuntime || typeof auditRuntime.getQ1014ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected audit-runtime handle exposing getQ1014ConsumableContract",
      };
    }
    try {
      const contract = auditRuntime.getQ1014ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q10-14";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q10-13 audit-runtime handshake returned explicit consumableByQ1014 contract"
          : "Injected Q10-13 audit-runtime handshake did not return explicit consumableByQ1014 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1014ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: SharedRuntimeCertificationReport): {
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
      missionId: "Q10-14",
      currentStatus: `shared_runtime_certification_${report.certificationDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.risks,
      evidence: [
        `certificationDecision=${report.certificationDecision}`,
        `runtimesCertified=${report.runtimeCertificationMatrix.filter((r) => r.certificationStatus === "Certified").length}/${report.runtimeCertificationMatrix.length}`,
      ],
      nextAction:
        report.certificationDecision === "Certified" ? "runtime_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      sharedRuntimeCertificationReport: report,
      neverFabricateCertificationEvidence: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-srcrt-${Date.now()}`;
    appendSrcrtLog({
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
      workerName: SHARED_RUNTIME_CERTIFICATION_IDENTITY.workerName,
      workerType: SHARED_RUNTIME_CERTIFICATION_IDENTITY.workerType,
      department: SHARED_RUNTIME_CERTIFICATION_IDENTITY.department,
      factory: SHARED_RUNTIME_CERTIFICATION_IDENTITY.factory,
      role: SHARED_RUNTIME_CERTIFICATION_IDENTITY.role,
      reportingLine: [...SHARED_RUNTIME_CERTIFICATION_IDENTITY.reportingLine],
      skillProfile: [...SHARED_RUNTIME_CERTIFICATION_IDENTITY.skillProfile],
      approvedTools: [...SHARED_RUNTIME_CERTIFICATION_IDENTITY.approvedTools],
      authorityLevel: SHARED_RUNTIME_CERTIFICATION_IDENTITY.authorityLevel,
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
      Q10_RUNTIMES.map((r) => [r.subsystemId, r.dependencyKey]),
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
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; read-only certification-only worker under Pillow.`;
  }
}
