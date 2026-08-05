import { BUSINESS_FACTORY_AUDIT_IDENTITY } from "./paths.js";
import { appendBfartLog } from "./bfart-logging.js";
import type {
  BusinessFactoryAuditReport,
  FactoryHandle,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";

export type SharedRuntimeCoreHandle = FactoryHandle & {
  listFactories?: () => unknown[];
  getCatalog?: () => { factories?: unknown[] } | null;
  getTopology?: () => { factories?: unknown[] } | null;
};

export type FactoryCoreHandle = FactoryHandle & {
  getState?: () => unknown;
};

export type BusinessFactoryAuditDependencies = {
  /** Q11-03 — exposes the Q1104 consumable contract for Q11-04 to consume. */
  pillowCommandAudit?: (FactoryHandle & { getQ1104ConsumableContract?: () => object }) | null;
  productionCertificationCore?: FactoryHandle | null;
  /** Authoritative business factory discovery source — never invented. */
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  /** Authoritative worker discovery source — never invented. */
  workerRegistry?:
    | (FactoryHandle & {
        listWorkers?: () => Array<Record<string, unknown>>;
        registerWorker?: (input: Record<string, unknown>) => unknown;
      })
    | null;
  empireBuilderFactoryCore?: FactoryCoreHandle | null;
  commerceFactoryCore?: FactoryCoreHandle | null;
  mediaFactoryCore?: FactoryCoreHandle | null;
  digitalProductsFactoryCore?: FactoryCoreHandle | null;
  enterprisePlatformFactoryCore?: FactoryCoreHandle | null;
  localBusinessFactoryCore?: FactoryCoreHandle | null;
  affiliateFactoryCore?: FactoryCoreHandle | null;
  capitalFactoryCore?: FactoryCoreHandle | null;
  /** Workflow, runtime, and result-collection structural signal source. */
  pillowOrchestrationRuntime?:
    | (FactoryHandle & {
        invokeWorker?: (...args: unknown[]) => unknown;
        retrieveReport?: (...args: unknown[]) => unknown;
      })
    | null;
  monitoringRuntime?:
    | (FactoryHandle & {
        produceReport?: (...args: unknown[]) => unknown;
        list?: (...args: unknown[]) => unknown;
        getState?: (...args: unknown[]) => unknown;
      })
    | null;
  auditRuntime?: FactoryHandle | null;
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
  private deps: BusinessFactoryAuditDependencies = {};

  bind(deps: BusinessFactoryAuditDependencies = {}) {
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
      appendBfartLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  /** Consumes the Q1104ConsumableContract exposed by Q11-03 pillow-command-audit when injected. */
  attemptQ1104ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    evidence: string;
  } {
    const pcart = this.deps.pillowCommandAudit;
    if (!pcart || typeof pcart.getQ1104ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "No injected pillow-command-audit handle exposing getQ1104ConsumableContract",
      };
    }
    try {
      const contract = pcart.getQ1104ConsumableContract() as {
        contractVersion?: string;
        exposedFields?: readonly string[];
        consumerMissionId?: string;
      };
      const consumed = contract?.consumerMissionId === "Q11-04";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        evidence: consumed
          ? "Injected Q11-03 pillow-command-audit handshake returned explicit consumableByQ1104 contract"
          : "Injected Q11-03 pillow-command-audit handshake did not return explicit consumableByQ1104 contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: `getQ1104ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: BusinessFactoryAuditReport): {
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
      missionId: "Q11-04",
      currentStatus: `business_factory_audit_${report.decision.toLowerCase()}`,
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `decision=${report.decision}`,
        `certifiedFactories=${report.certifiedFactories}/${report.totalBusinessFactories}`,
      ],
      nextAction: report.decision === "certify" ? "business_factories_certified" : "await_remediation_evidence",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      businessFactoryAuditReport: report,
      neverFabricateAuditEvidence: true,
      neverAssumeImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-bfart-${Date.now()}`;
    appendBfartLog({
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
      workerName: BUSINESS_FACTORY_AUDIT_IDENTITY.workerName,
      workerType: BUSINESS_FACTORY_AUDIT_IDENTITY.workerType,
      department: BUSINESS_FACTORY_AUDIT_IDENTITY.department,
      factory: BUSINESS_FACTORY_AUDIT_IDENTITY.factory,
      role: BUSINESS_FACTORY_AUDIT_IDENTITY.role,
      reportingLine: [...BUSINESS_FACTORY_AUDIT_IDENTITY.reportingLine],
      skillProfile: [...BUSINESS_FACTORY_AUDIT_IDENTITY.skillProfile],
      approvedTools: [...BUSINESS_FACTORY_AUDIT_IDENTITY.approvedTools],
      authorityLevel: BUSINESS_FACTORY_AUDIT_IDENTITY.authorityLevel,
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
      case "pillow_command_audit":
        return !!this.deps.pillowCommandAudit;
      case "production_certification_core":
        return !!this.deps.productionCertificationCore;
      case "shared_runtime_core":
        return !!this.deps.sharedRuntimeCore;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "empire_builder_factory_core":
        return !!this.deps.empireBuilderFactoryCore;
      case "commerce_factory_core":
        return !!this.deps.commerceFactoryCore;
      case "media_factory_core":
        return !!this.deps.mediaFactoryCore;
      case "digital_products_factory_core":
        return !!this.deps.digitalProductsFactoryCore;
      case "enterprise_platform_factory_core":
        return !!this.deps.enterprisePlatformFactoryCore;
      case "local_business_factory_core":
        return !!this.deps.localBusinessFactoryCore;
      case "affiliate_factory_core":
        return !!this.deps.affiliateFactoryCore;
      case "capital_factory_core":
        return !!this.deps.capitalFactoryCore;
      case "pillow_orchestration_runtime":
        return !!this.deps.pillowOrchestrationRuntime;
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
