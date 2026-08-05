import type { IntegrationHandshake } from "./types.js";

export type SharedRuntimeCoreHandle = {
  getTopology?: () => unknown;
  routeRequest?: (input: unknown) => unknown;
  getQ1002ConsumableContract?: () => unknown;
  createExecutionContext?: (input: unknown) => unknown;
};

export type WorkerRegistryHandle = {
  listWorkers?: () => unknown[];
  getWorkers?: () => unknown[];
  invokeWorker?: (payload: unknown) => unknown;
};

export type ToolRegistryHandle = {
  invokeTool?: (payload: unknown) => unknown;
};

export type ApprovalRouterHandle = {
  routeApproval?: (payload: unknown) => unknown;
};

export type ApprovalWorkflowHandle = {
  submitApproval?: (payload: unknown) => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (payload: unknown) => unknown;
  retrieveReport?: (payload: unknown) => unknown;
  getReport?: (payload: unknown) => unknown;
};

export type AuditRuntimeHandle = {
  recordAuditEvent?: (payload: unknown) => unknown;
};

export type WorkerRecoverySystemHandle = {
  registerRecoveryTarget?: (payload: unknown) => unknown;
  escalateFailure?: (payload: unknown) => unknown;
};

export type PillowOrchestrationRuntimeDependencies = {
  sharedRuntimeCore?: SharedRuntimeCoreHandle;
  workerRegistry?: WorkerRegistryHandle;
  toolRegistry?: ToolRegistryHandle;
  approvalRouter?: ApprovalRouterHandle;
  approvalWorkflow?: ApprovalWorkflowHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
  workerRecoverySystem?: WorkerRecoverySystemHandle;
};

export class PorIntegrationCoordinator {
  private deps: PillowOrchestrationRuntimeDependencies = {};

  bind(deps: PillowOrchestrationRuntimeDependencies = {}) {
    this.deps = { ...this.deps, ...deps };
  }

  getDependencies() {
    return { ...this.deps };
  }

  connect(integrationTargets: string[]): IntegrationHandshake[] {
    const map: Record<string, unknown> = {
      shared_runtime_core: this.deps.sharedRuntimeCore,
      worker_registry: this.deps.workerRegistry,
      approval_router: this.deps.approvalRouter,
      approval_workflow: this.deps.approvalWorkflow,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
    };

    return integrationTargets.map((target) => {
      const handle = map[target];
      const available = handle != null;
      return {
        target,
        available,
        probed: true,
        notes: available ? [`${target} connected — presence only`] : [`${target} unavailable`],
      };
    });
  }

  submitReport(report: unknown) {
    const err = this.deps.executiveReportingRuntime;
    if (err?.submitWorkerReport) {
      return err.submitWorkerReport(report);
    }
    return { records: [], offline: true };
  }

  recordAudit(payload: unknown) {
    const audit = this.deps.auditRuntime;
    if (audit?.recordAuditEvent) {
      return audit.recordAuditEvent(payload);
    }
    return { recorded: false, offline: true };
  }
}
