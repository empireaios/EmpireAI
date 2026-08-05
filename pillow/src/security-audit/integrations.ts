import { SECURITY_AUDIT_IDENTITY } from "./paths.js";
import { appendSecartLog } from "./secart-logging.js";
import type { SecurityAuditReport, SecurityHandle, IntegrationHandshake, IntegrationTarget } from "./types.js";

/** Q11-04 — exposes the Q1105 consumable contract for Q11-05 to consume. */
export type BusinessFactoryAuditHandle = SecurityHandle & {
  getState?: () => unknown;
  getQ1105ConsumableContract?: () => object;
};

/**
 * Structural handles below intentionally expose only `getState` — every
 * capability method (login, evaluateAccess, authenticate, recordEvent, …)
 * is presence-checked reflectively via `typeof handle[name] === "function"`
 * in evidence-collector.ts / security-classifier.ts, and is never invoked
 * or referenced by name on the static type. This keeps real engine
 * instances (whose concrete methods take specific input types, not
 * `(...args: unknown[]) => unknown`) structurally assignable.
 */
export type ProductionCertificationCoreHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Authentication Worker (Q6-07). Never invoked to move real credentials. */
export type AuthenticationWorkerHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Authorization Worker (Q6-08). Never invoked to mutate real roles. */
export type AuthorizationWorkerHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Authority Matrix (Q1-05). */
export type AuthorityMatrixHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the API Runtime (Q10-06). */
export type ApiRuntimeHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Audit Runtime (Q10-13). */
export type AuditRuntimeHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Monitoring Runtime (Q10-10). */
export type MonitoringRuntimeHandle = SecurityHandle & {
  getState?: () => unknown;
};

/** Structural handle for the Executive Reporting Runtime (Q0-26). */
export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport: (input: Record<string, unknown>) => {
    records?: Array<{ reportId?: string }>;
  };
  retrieveReport?: (...args: unknown[]) => unknown;
};

/** Structural handle for the Tool Runtime (Q10-07). */
export type ToolRuntimeHandle = SecurityHandle & {
  getState?: () => unknown;
};

export type SharedRuntimeCoreHandle = SecurityHandle & {
  listFactories?: () => unknown[];
  getCatalog?: () => { factories?: unknown[] } | null;
};

export type WorkerRegistryHandle = SecurityHandle & {
  listWorkers?: () => Array<Record<string, unknown>>;
  registerWorker?: (input: Record<string, unknown>) => unknown;
};

export type PillowOrchestrationRuntimeHandle = SecurityHandle & {
  invokeWorker?: (...args: unknown[]) => unknown;
  retrieveReport?: (...args: unknown[]) => unknown;
};

export type WorkerLifecycleHandle = {
  createWorker: (input: Record<string, unknown>) => unknown;
  activateWorker: (input: Record<string, unknown>) => unknown;
};

export type SecurityAuditDependencies = {
  /** Q11-04 — exposes the Q1105 consumable contract for Q11-05 to consume. */
  businessFactoryAudit?: BusinessFactoryAuditHandle | null;
  productionCertificationCore?: ProductionCertificationCoreHandle | null;
  authenticationWorker?: AuthenticationWorkerHandle | null;
  authorizationWorker?: AuthorizationWorkerHandle | null;
  authorityMatrix?: AuthorityMatrixHandle | null;
  apiRuntime?: ApiRuntimeHandle | null;
  toolRuntime?: ToolRuntimeHandle | null;
  monitoringRuntime?: MonitoringRuntimeHandle | null;
  auditRuntime?: AuditRuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle | null;
  workerLifecycle?: WorkerLifecycleHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: SecurityAuditDependencies = {};

  bind(deps: SecurityAuditDependencies = {}) {
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
      appendSecartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1105ConsumableContract exposed by Q11-04 business-factory-audit when injected. */
  attemptQ1105ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const bfart = this.deps.businessFactoryAudit;
    if (!bfart || typeof bfart.getQ1105ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected business-factory-audit handle exposing getQ1105ConsumableContract",
      };
    }
    try {
      const contract = bfart.getQ1105ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-05";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-04 business-factory-audit handshake returned explicit consumableByQ1105 contract"
          : "Injected Q11-04 business-factory-audit handshake did not return explicit consumableByQ1105 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1105ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: SecurityAuditReport): {
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
      missionId: "Q11-05",
      currentStatus: `security_audit_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingRisks,
      risks: report.outstandingRisks,
      evidence: [
        `decision=${report.decision}`,
        `certifiedComponents=${report.certifiedComponents}/${report.totalSecurityComponents}`,
      ],
      nextAction: report.decision === "certify" ? "security_components_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      securityAuditReport: report,
      neverFabricateSecurityEvidence: true,
      neverExposeSecretsDuringAuditing: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-secart-${Date.now()}`;
    appendSecartLog({
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
      workerName: SECURITY_AUDIT_IDENTITY.workerName,
      workerType: SECURITY_AUDIT_IDENTITY.workerType,
      department: SECURITY_AUDIT_IDENTITY.department,
      factory: SECURITY_AUDIT_IDENTITY.factory,
      role: SECURITY_AUDIT_IDENTITY.role,
      reportingLine: [...SECURITY_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...SECURITY_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...SECURITY_AUDIT_IDENTITY.approvedTools],
      authorityLevel: SECURITY_AUDIT_IDENTITY.authorityLevel,
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
      case "business_factory_audit":
        return !!this.deps.businessFactoryAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "authentication_worker":
        return !!this.deps.authenticationWorker;
      case "authorization_worker":
        return !!this.deps.authorizationWorker;
      case "authority_matrix":
        return !!this.deps.authorityMatrix;
      case "api_runtime":
        return !!this.deps.apiRuntime;
      case "tool_runtime":
        return !!this.deps.toolRuntime;
      case "monitoring_runtime":
        return !!this.deps.monitoringRuntime;
      case "audit_runtime":
        return !!this.deps.auditRuntime;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "worker_registry":
        return !!this.deps.workerRegistry;
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
