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

export type WorkerRegistryHandle = {
  listWorkers?: () => unknown[];
  invokeWorker?: (payload: unknown) => unknown;
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

export type MemoryRuntimeDependencies = {
  sharedRuntimeCore?: SharedRuntimeCoreHandle;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle;
  missionRuntime?: MissionRuntimeHandle;
  queueRuntime?: QueueRuntimeHandle;
  workerRegistry?: WorkerRegistryHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
  workerRecoverySystem?: WorkerRecoverySystemHandle;
  recovery?: RecoveryHandle;
};

export class MemrtIntegrationCoordinator {
  private deps: MemoryRuntimeDependencies = {};

  bind(deps: MemoryRuntimeDependencies = {}) {
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
      worker_registry: this.deps.workerRegistry,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
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
