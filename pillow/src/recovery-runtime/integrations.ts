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

export type ApiRuntimeHandle = {
  getQ1007ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type ToolRuntimeHandle = {
  getQ1008ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type CommunicationRuntimeHandle = {
  getQ1009ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type ApprovalRuntimeHandle = {
  getQ1010ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type MonitoringRuntimeHandle = {
  getQ1011ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
  list?: (input: unknown) => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (payload: unknown) => unknown;
  retrieveReport?: (payload: unknown) => unknown;
};

export type AuditRuntimeHandle = {
  recordAuditEvent?: (payload: unknown) => unknown;
};

/**
 * Presence probe only — Recovery Runtime must NOT call repair methods unless
 * a thin structural registerTarget exists.
 */
export type WorkerRecoverySystemHandle = {
  getStatus?: () => unknown;
  registerTarget?: (input: unknown) => unknown;
};

/**
 * Presence probe only — Recovery Runtime must NOT call repair/recover methods.
 */
export type RecoveryHandle = {
  getStatus?: () => unknown;
};

export type RecoveryRuntimeDependencies = {
  sharedRuntimeCore?: SharedRuntimeCoreHandle;
  pillowOrchestrationRuntime?: PillowOrchestrationRuntimeHandle;
  missionRuntime?: MissionRuntimeHandle;
  queueRuntime?: QueueRuntimeHandle;
  memoryRuntime?: MemoryRuntimeHandle;
  apiRuntime?: ApiRuntimeHandle;
  toolRuntime?: ToolRuntimeHandle;
  communicationRuntime?: CommunicationRuntimeHandle;
  approvalRuntime?: ApprovalRuntimeHandle;
  monitoringRuntime?: MonitoringRuntimeHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
  workerRecoverySystem?: WorkerRecoverySystemHandle;
  recovery?: RecoveryHandle;
};

export class RecrtIntegrationCoordinator {
  private deps: RecoveryRuntimeDependencies = {};

  bind(deps: RecoveryRuntimeDependencies = {}) {
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
      api_runtime: this.deps.apiRuntime,
      tool_runtime: this.deps.toolRuntime,
      communication_runtime: this.deps.communicationRuntime,
      approval_runtime: this.deps.approvalRuntime,
      monitoring_runtime: this.deps.monitoringRuntime,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
      recovery: this.deps.recovery ?? this.deps.workerRecoverySystem,
    };

    return integrationTargets.map((target) => {
      const handle = map[target];
      const available = handle != null;
      const isPresenceOnly =
        target === "recovery" ||
        target === "worker_recovery_system" ||
        target === "audit_runtime";
      return {
        target,
        available,
        probed: true,
        notes: available
          ? [
              `${target} connected — presence only`,
              ...(isPresenceOnly
                ? ["Recovery Runtime prefers presence probe; no repair/audit implementation"]
                : []),
            ]
          : [`${target} unavailable`],
      };
    });
  }

  getQ1011ConsumableContract() {
    return this.deps.monitoringRuntime?.getQ1011ConsumableContract?.() ?? null;
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

  /** Thin structural presence registration only — never repair. */
  registerWorkerRecoveryTarget(input: unknown) {
    const wrs = this.deps.workerRecoverySystem;
    if (wrs?.registerTarget) {
      return wrs.registerTarget(input);
    }
    return { registered: false, offline: true, presenceOnly: true };
  }
}
