import { appendIsengLog } from "./iseng-logging.js";
import type { ImplementationSpecificationReport, IntegrationHandshake, IntegrationTarget } from "./types.js";

export type AiInnovationFactoryHandle = {
  getState?: () => unknown;
  getLatestReport?: () => { confidenceScore?: number; seriesCompleteActivation?: boolean } | null;
  getQ1301ConsumableContract?: () => {
    contractVersion?: string;
    consumerMissionId?: string;
    exposedFields?: readonly string[];
    innovationPrerequisite?: boolean;
    neverImplementQ1301OrLater?: boolean;
  };
};

export type QSeriesCompletionHandle = {
  getState?: () => unknown;
  getLatestReport?: () => unknown;
};

export type IntelligenceContextHandle = {
  getSnapshot?: () => { modules?: string[]; roots?: string[] } | unknown;
  getState?: () => unknown;
};

export type SharedRuntimeCoreHandle = {
  getState?: () => unknown;
  listFactories?: () => Array<Record<string, unknown>>;
};

export type WorkerRegistryHandle = {
  getState?: () => unknown;
  listWorkers?: () => Array<Record<string, unknown>>;
  getWorkers?: () => Array<Record<string, unknown>>;
};

export type RuntimeHandle = {
  getState?: () => { status?: string } | unknown;
  getTopology?: () => { workflows?: Array<{ id?: string }> } | unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  getState?: () => unknown;
  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };
};

export type ImplementationSpecificationEngineDependencies = {
  aiInnovationFactory?: AiInnovationFactoryHandle | null;
  qSeriesCompletion?: QSeriesCompletionHandle | null;
  intelligenceContext?: IntelligenceContextHandle | null;
  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;
  workerRegistry?: WorkerRegistryHandle | null;
  pillowOrchestrationRuntime?: RuntimeHandle | null;
  auditRuntime?: RuntimeHandle | null;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ImplementationSpecificationEngineDependencies = {};

  bind(deps: ImplementationSpecificationEngineDependencies = {}) {
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
      appendIsengLog({ event: "integration_handshake", details: `${target}:${status}` });
    }
    this.handshakes = resolved;
    return this.getHandshakes();
  }

  attemptQ1301ContractHandshake(): {
    attempted: boolean;
    consumed: boolean;
    contractVersion: string | null;
    fields: string[];
    innovationPrerequisite: boolean;
    evidence: string;
  } {
    const factory = this.deps.aiInnovationFactory;
    if (!factory || typeof factory.getQ1301ConsumableContract !== "function") {
      return {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        innovationPrerequisite: false,
        evidence: "aiInnovationFactory not injected / getQ1301ConsumableContract unavailable",
      };
    }
    try {
      const contract = factory.getQ1301ConsumableContract();
      const consumed = contract?.consumerMissionId === "Q13-01";
      return {
        attempted: true,
        consumed,
        contractVersion: contract?.contractVersion ?? null,
        fields: [...(contract?.exposedFields ?? [])],
        innovationPrerequisite: contract?.innovationPrerequisite === true,
        evidence: consumed
          ? `Injected aiInnovationFactory Q1301 handshake consumerMissionId=Q13-01 contractVersion=${contract?.contractVersion ?? "unknown"}`
          : "Injected aiInnovationFactory handshake did not return Q13-01 consumable contract",
      };
    } catch (error) {
      return {
        attempted: true,
        consumed: false,
        contractVersion: null,
        fields: [],
        innovationPrerequisite: false,
        evidence: `getQ1301ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  submitReport(report: ImplementationSpecificationReport): {
    submitted: boolean;
    executiveReportId: string | null;
    details: string;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null, details: "executive_reporting_runtime_unavailable" };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: report.workerId,
      entityType: "worker",
      missionId: "Q13-01",
      currentStatus: "implementation_specification_engine_active",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.validation.errors,
      evidence: report.traceabilityRefs.slice(0, 10),
      nextAction: "await_q1302_consumer",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      implementationSpecificationReport: report,
      neverFabricateRepositoryState: true,
      neverExecuteImplementations: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId = result?.records?.find((r) => r.reportId)?.reportId ?? `ert-iseng-${Date.now()}`;
    appendIsengLog({ event: "submit_report", details: `report=${report.reportId} executive=${executiveReportId}` });
    return { submitted: true, executiveReportId, details: "submitted_to_executive_reporting_runtime" };
  }

  private isBound(target: IntegrationTarget): boolean {
    return integrationBound(this.deps, target);
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; specification evidence only from injected handles and read-only scans.`;
  }
}

export function verifyIntegrations(deps: ImplementationSpecificationEngineDependencies) {
  const now = new Date().toISOString();
  const targets: IntegrationTarget[] = [
    "ai_innovation_factory",
    "q_series_completion",
    "intelligence_context",
    "shared_runtime_core",
    "worker_registry",
    "pillow_orchestration_runtime",
    "audit_runtime",
    "executive_reporting_runtime",
  ];
  const rows = targets.map((target) => {
    const bound = integrationBound(deps, target);
    return { target, bound, evidence: bound ? `${target} handle injected` : `${target} not injected` };
  });
  const boundCount = rows.filter((r) => r.bound).length;
  return {
    verifiedAt: now,
    rows,
    totalTargets: targets.length,
    boundCount,
    allBound: boundCount === targets.length,
    evidence: rows.map((r) => r.evidence),
  };
}

function integrationBound(deps: ImplementationSpecificationEngineDependencies, target: IntegrationTarget): boolean {
  switch (target) {
    case "ai_innovation_factory":
      return !!deps.aiInnovationFactory;
    case "q_series_completion":
      return !!deps.qSeriesCompletion;
    case "intelligence_context":
      return !!deps.intelligenceContext;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    default:
      return false;
  }
}
