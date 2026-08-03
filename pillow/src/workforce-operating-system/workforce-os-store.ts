import { WFOS_METADATA_VERSION } from "./paths.js";
import type {
  HealthStatus,
  OrganizationState,
  RuntimeEvent,
  ValidationStatus,
  WorkforceOsRecord,
  WorkforceOsService,
} from "./types.js";

/** Authoritative in-memory Workforce OS record store — runtime only. */
export class WorkforceOsStore {
  private records = new Map<string, WorkforceOsRecord>();

  seed(records: WorkforceOsRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.runtimeId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(runtimeId: string) {
    const record = this.records.get(runtimeId);
    return record ? clone(record) : null;
  }

  save(record: WorkforceOsRecord) {
    this.records.set(record.runtimeId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    runtimeId?: string | null;
    organizationState: OrganizationState;
    activeDepartments: string[];
    activeFactories: string[];
    activeWorkers: string[];
    activeMissions: string[];
    runtimeHealth: HealthStatus;
    runtimeEvents: RuntimeEvent[];
    openSessions: string[];
    servicesInvoked: Array<WorkforceOsService | string>;
    validationStatus: ValidationStatus;
  }): WorkforceOsRecord {
    runtimeSequence += 1;
    const runtimeId = params.runtimeId?.trim() || `wfos-rt-${Date.now()}-${runtimeSequence}`;
    const record: WorkforceOsRecord = {
      runtimeId,
      timestamp: new Date().toISOString(),
      organizationState: params.organizationState,
      activeDepartments: unique(params.activeDepartments),
      activeFactories: unique(params.activeFactories),
      activeWorkers: unique(params.activeWorkers),
      activeMissions: unique(params.activeMissions),
      runtimeHealth: params.runtimeHealth,
      runtimeEvents: params.runtimeEvents.map((e) => ({ ...e })),
      metadataVersion: WFOS_METADATA_VERSION,
      runtimeTraceId: `wfos-trace-${Date.now()}-${runtimeSequence}`,
      validationStatus: params.validationStatus,
      openSessions: unique(params.openSessions),
      servicesInvoked: unique(params.servicesInvoked.map(String)),
      neverReplacePillow: true,
      neverReplaceWorkforceOrchestrator: true,
      neverExecuteWorkerTasks: true,
      neverMakeStrategicDecisions: true,
      neverOverrideGrandKing: true,
      pillowReplaced: false,
      workforceOrchestratorReplaced: false,
      workerTasksExecuted: false,
      strategicDecisionsMade: false,
      grandKingOverridden: false,
      preserveRuntimeTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let runtimeSequence = 0;
let eventSequence = 0;

export function nextRuntimeEvent(kind: string, summary: string): RuntimeEvent {
  eventSequence += 1;
  return {
    eventId: `wfos-evt-${Date.now()}-${eventSequence}`,
    timestamp: new Date().toISOString(),
    kind,
    summary,
  };
}

export function resetRuntimeSequenceForTesting() {
  runtimeSequence = 0;
  eventSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: WorkforceOsRecord): WorkforceOsRecord {
  return {
    ...record,
    activeDepartments: [...record.activeDepartments],
    activeFactories: [...record.activeFactories],
    activeWorkers: [...record.activeWorkers],
    activeMissions: [...record.activeMissions],
    runtimeEvents: record.runtimeEvents.map((e) => ({ ...e })),
    openSessions: [...record.openSessions],
    servicesInvoked: [...record.servicesInvoked],
  };
}
