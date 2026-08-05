import { Q10_RUNTIME_IDS } from "./paths.js";
import { PRODUCTION_CERTIFICATION_CORE_IDENTITY } from "./paths.js";
import { appendPccrtLog } from "./pccrt-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  ProductionCertificationReport,
  WorkerHandle,
} from "./types.js";

/** Optional Q10-01..Q10-13 runtime handles used only for discovery probes. */
export type Q10RuntimeDependencies = {
  sharedRuntimeCore?:
    | (WorkerHandle & {
        listFactories?: () => Array<Record<string, unknown>>;
        getTopology?: () => object;
        getQ1002ConsumableContract?: () => object;
      })
    | null;
  pillowOrchestrationRuntime?: WorkerHandle | null;
  missionRuntime?: WorkerHandle | null;
  queueRuntime?: WorkerHandle | null;
  memoryRuntime?: WorkerHandle | null;
  apiRuntime?: WorkerHandle | null;
  toolRuntime?: WorkerHandle | null;
  communicationRuntime?: WorkerHandle | null;
  approvalRuntime?: WorkerHandle | null;
  monitoringRuntime?: WorkerHandle | null;
  recoveryRuntime?: WorkerHandle | null;
  schedulingRuntime?: WorkerHandle | null;
  auditRuntime?: WorkerHandle | null;
};

export type ProductionCertificationCoreDependencies = Q10RuntimeDependencies & {
  /** Q10-14 — exposes the Q1101 consumable contract for Q11-01 to consume. */
  sharedRuntimeCertification?:
    | (WorkerHandle & { getQ1101ConsumableContract?: () => object })
    | null;
  workerRegistry?:
    | (WorkerHandle & {
        listWorkers?: () => Array<Record<string, unknown>>;
        registerWorker?: (input: Record<string, unknown>) => unknown;
      })
    | null;
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
  private deps: ProductionCertificationCoreDependencies = {};

  bind(deps: ProductionCertificationCoreDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getAllRuntimeHandles(): Map<string, WorkerHandle | undefined> {
    return new Map(
      Q10_RUNTIME_IDS.map((r) => [
        r.missionId,
        (this.deps as Record<string, unknown>)[r.dependencyKey] as WorkerHandle | undefined,
      ]),
    );
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
      appendPccrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1101ConsumableContract exposed by Q10-14 shared-runtime-certification when injected. */
  attemptQ1101ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const srcrt = this.deps.sharedRuntimeCertification;
    if (!srcrt || typeof srcrt.getQ1101ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected shared-runtime-certification handle exposing getQ1101ConsumableContract",
      };
    }
    try {
      const contract = srcrt.getQ1101ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-01";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q10-14 shared-runtime-certification handshake returned explicit consumableByQ1101 contract"
          : "Injected Q10-14 shared-runtime-certification handshake did not return explicit consumableByQ1101 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1101ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: ProductionCertificationReport): {
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
      missionId: "Q11-01",
      currentStatus: `production_certification_core_${report.certificationDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingRisks,
      risks: report.outstandingRisks,
      evidence: [
        `certificationDecision=${report.certificationDecision}`,
        `certifiedRows=${report.readinessSummary.certifiedCount}/${report.readinessSummary.totalItems}`,
      ],
      nextAction:
        report.certificationDecision === "Certified" ? "production_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      productionCertificationReport: report,
      neverFabricateCertificationEvidence: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-pccrt-${Date.now()}`;
    appendPccrtLog({
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
      workerName: PRODUCTION_CERTIFICATION_CORE_IDENTITY.workerName,
      workerType: PRODUCTION_CERTIFICATION_CORE_IDENTITY.workerType,
      department: PRODUCTION_CERTIFICATION_CORE_IDENTITY.department,
      factory: PRODUCTION_CERTIFICATION_CORE_IDENTITY.factory,
      role: PRODUCTION_CERTIFICATION_CORE_IDENTITY.role,
      reportingLine: [...PRODUCTION_CERTIFICATION_CORE_IDENTITY.reportingLine],
      skillProfile: [...PRODUCTION_CERTIFICATION_CORE_IDENTITY.skillProfile],
      approvedTools: [...PRODUCTION_CERTIFICATION_CORE_IDENTITY.approvedTools],
      authorityLevel: PRODUCTION_CERTIFICATION_CORE_IDENTITY.authorityLevel,
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
    switch (target) {
      case "shared-runtime-core":
      case "shared-runtime-core-factories":
        return !!this.deps.sharedRuntimeCore;
      case "shared-runtime-certification":
        return !!this.deps.sharedRuntimeCertification;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "approval_runtime":
        return !!this.deps.approvalRuntime;
      case "recovery_runtime":
        return !!this.deps.recoveryRuntime;
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
