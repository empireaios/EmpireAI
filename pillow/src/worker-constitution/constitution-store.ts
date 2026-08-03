import { WCT_METADATA_VERSION } from "./paths.js";
import type {
  ComplianceDecision,
  ValidationStatus,
  WorkerConstitutionInput,
  WorkerInheritanceRecord,
  WorkerLifecycleStage,
} from "./types.js";

/** Authoritative in-memory Worker Constitution store — define/inherit only. */
export class ConstitutionStore {
  private records = new Map<string, WorkerInheritanceRecord>();
  private latestByWorker = new Map<string, string>();

  seed(records: WorkerInheritanceRecord[]) {
    this.records.clear();
    this.latestByWorker.clear();
    for (const record of records) {
      this.records.set(record.inheritanceId, clone(record));
      this.latestByWorker.set(record.workerId, record.inheritanceId);
    }
  }

  count() {
    return this.records.size;
  }

  compliantCount() {
    return this.list().filter((r) => r.complianceDecision === "compliant").length;
  }

  nonCompliantCount() {
    return this.list().filter((r) => r.complianceDecision === "non_compliant").length;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(inheritanceId: string) {
    const record = this.records.get(inheritanceId);
    return record ? clone(record) : null;
  }

  getLatestForWorker(workerId: string) {
    const id = this.latestByWorker.get(workerId);
    return id ? this.get(id) : null;
  }

  save(record: WorkerInheritanceRecord) {
    this.records.set(record.inheritanceId, clone(record));
    this.latestByWorker.set(record.workerId, record.inheritanceId);
    return clone(record);
  }

  buildRecord(params: {
    input: WorkerConstitutionInput;
    workerId: string;
    workerName: string;
    department: string;
    constitutionVersion: string;
    lifecycleStage: WorkerLifecycleStage | string;
    complianceDecision: ComplianceDecision | string;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    inheritanceId?: string;
  }): WorkerInheritanceRecord {
    inheritanceSequence += 1;
    const inheritanceId =
      params.inheritanceId?.trim() ||
      params.input.inheritanceId?.trim() ||
      `wct-inh-${Date.now()}-${inheritanceSequence}`;
    const record: WorkerInheritanceRecord = {
      inheritanceId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      workerName: params.workerName,
      department: params.department,
      constitutionVersion: params.constitutionVersion,
      lifecycleStage: params.lifecycleStage,
      complianceDecision: params.complianceDecision,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      inherited: true,
      metadataVersion: WCT_METADATA_VERSION,
      inheritanceTraceId: `wct-trace-${Date.now()}-${inheritanceSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerQualityStandard: true,
      neverReplaceGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workerQualityStandardReplaced: false,
      governanceReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let inheritanceSequence = 0;

export function resetInheritanceSequenceForTesting() {
  inheritanceSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: WorkerInheritanceRecord): WorkerInheritanceRecord {
  return {
    ...record,
    rulesApplied: [...record.rulesApplied],
    rulesSatisfied: [...record.rulesSatisfied],
    rulesFailed: [...record.rulesFailed],
  };
}
