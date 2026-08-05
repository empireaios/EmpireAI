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
  enqueue?: (input: unknown) => unknown;
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

export type RecoveryRuntimeHandle = {
  getQ1012ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type SchedulingRuntimeHandle = {
  getQ1013ConsumableContract?: () => unknown;
  produceReport?: (input: unknown) => unknown;
  getHistory?: () => unknown;
};

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (payload: unknown) => unknown;
  retrieveReport?: (payload: unknown) => unknown;
};

/** Compatibility shape used by other runtimes for presence / recordAuditEvent. */
export type AuditRuntimeHandle = {
  recordAuditEvent?: (payload: unknown) => unknown;
};

export type AuditRuntimeDependencies = {
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
  recoveryRuntime?: RecoveryRuntimeHandle;
  schedulingRuntime?: SchedulingRuntimeHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
};

export class AudrtIntegrationCoordinator {
  private deps: AuditRuntimeDependencies = {};
  private recordAuditEventFn: ((payload: unknown) => unknown) | null = null;

  bind(deps: AuditRuntimeDependencies = {}) {
    this.deps = { ...this.deps, ...deps };
  }

  /**
   * Expose recordAuditEvent on the coordinator for presence/compatibility
   * with AuditRuntimeHandle used by other runtimes.
   */
  setRecordAuditEvent(fn: (payload: unknown) => unknown) {
    this.recordAuditEventFn = fn;
  }

  recordAuditEvent(payload: unknown) {
    if (this.recordAuditEventFn) {
      return this.recordAuditEventFn(payload);
    }
    return { recorded: false, offline: true };
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
      recovery_runtime: this.deps.recoveryRuntime,
      scheduling_runtime: this.deps.schedulingRuntime,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
    };

    return integrationTargets.map((target) => {
      const handle = map[target];
      const available = handle != null;
      return {
        target,
        available,
        probed: true,
        notes: available
          ? [
              `${target} connected — presence only`,
              ...(target === "scheduling_runtime"
                ? ["Consumes Q1013ConsumableContract structurally — does not implement Scheduling Runtime"]
                : []),
              "Audit Runtime never executes business logic against integrations",
            ]
          : [`${target} unavailable`],
      };
    });
  }

  getQ1013ConsumableContract() {
    return this.deps.schedulingRuntime?.getQ1013ConsumableContract?.() ?? null;
  }

  submitReport(report: unknown) {
    const err = this.deps.executiveReportingRuntime;
    if (err?.submitWorkerReport) {
      return err.submitWorkerReport(report);
    }
    return { records: [], offline: true };
  }
}
