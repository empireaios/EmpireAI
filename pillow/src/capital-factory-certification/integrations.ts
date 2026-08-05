import { Q9_MISSIONS } from "./mission-catalog.js";
import { CAPITAL_FACTORY_CERTIFICATION_IDENTITY } from "./paths.js";
import { appendCapcrtLog } from "./capcrt-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  CapitalCertificationReport,
  WorkerHandle,
} from "./types.js";

/** Q9-01..Q9-10 worker handles, keyed by session.ts dependencyKey. */
export type Q9WorkerDependencies = {
  capitalFactoryCore?: WorkerHandle | null;
  accountingWorker?: WorkerHandle | null;
  cashflowWorker?: WorkerHandle | null;
  budgetPlanningWorker?: WorkerHandle | null;
  profitabilityWorker?: WorkerHandle | null;
  forecastingWorker?: WorkerHandle | null;
  taxSupportWorker?: WorkerHandle | null;
  investmentPlanningWorker?: WorkerHandle | null;
  financialReportingWorker?: WorkerHandle | null;
  /** Q9-10 — exposes Q911 consumable contract handshake. */
  capitalRiskWorker?: (WorkerHandle & { getQ911ConsumableContract?: () => object }) | null;
};

export type CapitalFactoryCertificationDependencies = Q9WorkerDependencies & {
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
  private deps: CapitalFactoryCertificationDependencies = {};

  bind(deps: CapitalFactoryCertificationDependencies = {}) {
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
    for (const mission of Q9_MISSIONS) {
      if ((this.deps as Record<string, unknown>)[mission.dependencyKey]) {
        keys.add(mission.dependencyKey);
      }
    }
    return keys;
  }

  getWorkerHandle(dependencyKey: string): WorkerHandle | undefined {
    const handle = (this.deps as Record<string, unknown>)[dependencyKey];
    return handle ? (handle as WorkerHandle) : undefined;
  }

  getAllWorkerHandles(): Map<string, WorkerHandle | undefined> {
    return new Map(Q9_MISSIONS.map((m) => [m.missionId, this.getWorkerHandle(m.dependencyKey)]));
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
      appendCapcrtLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  attemptQ911ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const riskWorker = this.deps.capitalRiskWorker;
    if (!riskWorker || typeof riskWorker.getQ911ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence:
          "No injected capital-risk-worker handle exposing getQ911ConsumableContract",
      };
    }
    try {
      const contract = riskWorker.getQ911ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q9-11";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q9-10 capital-risk-worker handshake returned explicit consumableByQ911 contract"
          : "Injected Q9-10 capital-risk-worker handshake did not return explicit consumableByQ911 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ911ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: CapitalCertificationReport): {
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
      missionId: "Q9-11",
      currentStatus: `capital_factory_certification_${report.certificationDecision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.openIssues,
      risks: report.risks,
      evidence: [
        `certificationDecision=${report.certificationDecision}`,
        `workersCertified=${report.workerCertificationMatrix.filter((r) => r.status === "Certified").length}/${report.workerCertificationMatrix.length}`,
      ],
      nextAction:
        report.certificationDecision === "Certified"
          ? "factory_certified"
          : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      capitalCertificationReport: report,
      neverFabricateSuccessfulTests: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-capcrt-${Date.now()}`;
    appendCapcrtLog({
      event: "submit_report",
      details: `report=${report.certificationId} executive=${executiveReportId}`,
    });
    try {
      this.deps.auditRuntime?.recordAuditEvent?.({
        kind: "capital_factory_certification_report",
        reportId: report.certificationId,
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
      workerName: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.workerName,
      workerType: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.workerType,
      department: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.department,
      factory: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.factory,
      role: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.role,
      reportingLine: [...CAPITAL_FACTORY_CERTIFICATION_IDENTITY.reportingLine],
      skillProfile: [...CAPITAL_FACTORY_CERTIFICATION_IDENTITY.skillProfile],
      approvedTools: [...CAPITAL_FACTORY_CERTIFICATION_IDENTITY.approvedTools],
      authorityLevel: CAPITAL_FACTORY_CERTIFICATION_IDENTITY.authorityLevel,
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
      Q9_MISSIONS.map((m) => [m.subsystemId, m.dependencyKey]),
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
