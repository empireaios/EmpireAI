import type { IntegrationHandshake } from "./types.js";

export type SharedRuntimeCoreHandle = {
  getTopology?: () => unknown;
  routeRequest?: (input: unknown) => unknown;
  getQ1002ConsumableContract?: () => unknown;
};

export type PillowOrchestrationRuntimeHandle = {
  invokeWorker?: (input: unknown) => unknown;
  invokeTool?: (input: unknown) => unknown;
  getQ1003ConsumableContract?: () => unknown;
  produceOrchestrationReport?: (input: unknown) => unknown;
};

export type MissionRuntimeHandle = {
  getQ1004ConsumableContract?: () => unknown;
  createMission?: (input: unknown) => unknown;
  monitor?: (input: unknown) => unknown;
};

export type QueueRuntimeHandle = {
  getQ1005ConsumableContract?: () => unknown;
  getHistory?: () => unknown;
  produceReport?: (input: unknown) => unknown;
};

export type MemoryRuntimeHandle = {
  getQ1006ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type ApprovalRuntimeHandle = {
  checkApproval?: (input: unknown) => unknown;
  recordApproval?: (input: unknown) => unknown;
};

export type MonitoringRuntimeHandle = {
  recordMetric?: (input: unknown) => unknown;
  getHealth?: () => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (payload: unknown) => unknown;
  retrieveReport?: (payload: unknown) => unknown;
};

export type AuditRuntimeHandle = {
  recordAuditEvent?: (payload: unknown) => unknown;
};

export type WorkerRecoverySystemHandle = {
  registerRecoveryTarget?: (payload: unknown) => unknown;
  escalateFailure?: (payload: unknown) => unknown;
};

export type RecoveryHandle = {
  registerTarget?: (payload: unknown) => unknown;
  recover?: (payload: unknown) => unknown;
};

export type ApiTransportHandle = {
  execute?: (req: {
    apiId: string;
    provider: string;
    endpoint: string;
    method: string;
    path: string;
    requestRef: string;
    credentialReference: string;
  }) => {
    statusCode: number;
    responseRef: string;
    liveCallExecuted: true;
  };
};

export type ApiRuntimeDependencies = {
  sharedRuntimeCore?: SharedRuntimeCoreHandle;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle;
  missionRuntime?: MissionRuntimeHandle;
  queueRuntime?: QueueRuntimeHandle;
  memoryRuntime?: MemoryRuntimeHandle;
  approvalRuntime?: ApprovalRuntimeHandle;
  monitoringRuntime?: MonitoringRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  workerRecoverySystem?: WorkerRecoverySystemHandle;
  recovery?: RecoveryHandle;
  /** Optional live transport. Without it, liveCallExecuted=false and no response body is fabricated. */
  transport?: ApiTransportHandle;
};

export class ApirtIntegrationCoordinator {
  private deps: ApiRuntimeDependencies = {};

  bind(deps: ApiRuntimeDependencies = {}) {
    this.deps = { ...this.deps, ...deps };
  }

  getDependencies() {
    return { ...this.deps };
  }

  connect(integrationTargets: string[]): IntegrationHandshake[] {
    const map: Record<string, unknown> = {
      shared_runtime_core: this.deps.sharedRuntimeCore,
      pillow_orchestration_runtime: this.deps.pillowOrchestrationRuntime,
      mission_runtime: this.deps.missionRuntime,
      queue_runtime: this.deps.queueRuntime,
      memory_runtime: this.deps.memoryRuntime,
      approval_runtime: this.deps.approvalRuntime,
      monitoring_runtime: this.deps.monitoringRuntime,
      audit_runtime: this.deps.auditRuntime,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
      recovery: this.deps.recovery ?? this.deps.workerRecoverySystem,
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

  getQ1006ConsumableContract() {
    return this.deps.memoryRuntime?.getQ1006ConsumableContract?.() ?? null;
  }

  executeTransport(req: {
    apiId: string;
    provider: string;
    endpoint: string;
    method: string;
    path: string;
    requestRef: string;
    credentialReference: string;
  }): { statusCode: number; responseRef: string; liveCallExecuted: boolean } | null {
    if (!this.deps.transport?.execute) return null;
    const result = this.deps.transport.execute(req);
    return {
      statusCode: result.statusCode,
      responseRef: result.responseRef,
      liveCallExecuted: true,
    };
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
