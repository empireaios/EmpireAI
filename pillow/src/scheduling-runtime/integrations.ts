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

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (payload: unknown) => unknown;
  retrieveReport?: (payload: unknown) => unknown;
};

export type AuditRuntimeHandle = {
  recordAuditEvent?: (payload: unknown) => unknown;
};

export type SchedulingRuntimeDependencies = {
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
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
};

export class SchrtIntegrationCoordinator {
  private deps: SchedulingRuntimeDependencies = {};

  bind(deps: SchedulingRuntimeDependencies = {}) {
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
      recovery_runtime: this.deps.recoveryRuntime,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
    };

    return integrationTargets.map((target) => {
      const handle = map[target];
      const available = handle != null;
      const isPresenceOnly = target === "audit_runtime";
      return {
        target,
        available,
        probed: true,
        notes: available
          ? [
              `${target} connected — presence only`,
              ...(isPresenceOnly
                ? ["Scheduling Runtime does not implement Audit Runtime"]
                : []),
              ...(target === "queue_runtime"
                ? ["Structural enqueue signals only — never replaces Queue Runtime"]
                : []),
              ...(target === "mission_runtime"
                ? ["Structural mission triggers only — never replaces Mission Runtime"]
                : []),
            ]
          : [`${target} unavailable`],
      };
    });
  }

  getQ1012ConsumableContract() {
    return this.deps.recoveryRuntime?.getQ1012ConsumableContract?.() ?? null;
  }

  getMissionRuntime() {
    return this.deps.missionRuntime;
  }

  getQueueRuntime() {
    return this.deps.queueRuntime;
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
