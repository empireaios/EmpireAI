import { PECC_METADATA_VERSION } from "./paths.js";
import type {
  CommandStatus,
  ExecutiveCommandCenterInput,
  ExecutiveCommandRecord,
  ExecutiveCommandType,
  RoutedService,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Executive Command Center store — coordinate/route only. */
export class ExecutiveCommandStore {
  private records = new Map<string, ExecutiveCommandRecord>();

  seed(records: ExecutiveCommandRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.commandId, clone(record));
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

  get(commandId: string) {
    const record = this.records.get(commandId);
    return record ? clone(record) : null;
  }

  save(record: ExecutiveCommandRecord) {
    this.records.set(record.commandId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: ExecutiveCommandCenterInput;
    requestedCapability: ExecutiveCommandType | string;
    routedService: RoutedService | string;
    currentStatus: CommandStatus;
    result: string;
    relatedWorkers?: string[];
    relatedTools?: string[];
    payloadSummary?: string;
    validationStatus: ValidationStatus;
  }): ExecutiveCommandRecord {
    commandSequence += 1;
    const commandId =
      params.input.commandId?.trim() || `pecc-cmd-${Date.now()}-${commandSequence}`;
    const record: ExecutiveCommandRecord = {
      commandId,
      timestamp: new Date().toISOString(),
      executiveRequest:
        params.input.executiveRequest?.trim() ||
        `Executive ${params.requestedCapability} via ${params.routedService}`,
      requestedCapability: params.requestedCapability,
      routedService: params.routedService,
      relatedBusiness: params.input.relatedBusiness?.trim() || "biz-unspecified",
      relatedMission: params.input.relatedMission?.trim() || "mission-unspecified",
      currentStatus: params.currentStatus,
      result: params.result,
      executionReference: `pecc-ref-${commandId}`,
      metadataVersion: PECC_METADATA_VERSION,
      commandTraceId: `pecc-trace-${Date.now()}-${commandSequence}`,
      validationStatus: params.validationStatus,
      relatedWorkers: unique(params.relatedWorkers ?? []),
      relatedTools: unique(params.relatedTools ?? []),
      payloadSummary: params.payloadSummary ?? params.result,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      workforceOrchestratorReplaced: false,
      workersReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveCommandTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let commandSequence = 0;

export function resetCommandSequenceForTesting() {
  commandSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: ExecutiveCommandRecord): ExecutiveCommandRecord {
  return {
    ...record,
    relatedWorkers: [...record.relatedWorkers],
    relatedTools: [...record.relatedTools],
  };
}
