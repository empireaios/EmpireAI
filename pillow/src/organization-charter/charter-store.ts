import { OCH_METADATA_VERSION } from "./paths.js";
import type {
  DepartmentDefinition,
  FactoryDefinition,
  OrganizationCharterInput,
  OrganizationStructureRecord,
  StructureDecision,
  ValidationStatus,
  WorkerOwnership,
} from "./types.js";

/** Authoritative in-memory Organization Charter store — define/register only. */
export class CharterStore {
  private factories = new Map<string, FactoryDefinition>();
  private departments = new Map<string, DepartmentDefinition>();
  private workers = new Map<string, WorkerOwnership>();
  private records = new Map<string, OrganizationStructureRecord>();

  seed(params: {
    factories: FactoryDefinition[];
    departments: DepartmentDefinition[];
    workers: WorkerOwnership[];
    records: OrganizationStructureRecord[];
  }) {
    this.factories.clear();
    this.departments.clear();
    this.workers.clear();
    this.records.clear();
    for (const f of params.factories) {
      this.factories.set(f.factoryId, {
        ...f,
        responsibilities: [...f.responsibilities],
        reportsTo: "pillow",
      });
    }
    for (const d of params.departments) {
      this.departments.set(d.departmentId, {
        ...d,
        responsibilities: [...d.responsibilities],
      });
    }
    for (const w of params.workers) {
      this.workers.set(w.workerId, { ...w });
    }
    for (const r of params.records) {
      this.records.set(r.structureRecordId, clone(r));
    }
  }

  listFactories() {
    return [...this.factories.values()].map((f) => ({
      ...f,
      responsibilities: [...f.responsibilities],
      reportsTo: "pillow" as const,
    }));
  }

  listDepartments() {
    return [...this.departments.values()].map((d) => ({
      ...d,
      responsibilities: [...d.responsibilities],
    }));
  }

  listWorkers() {
    return [...this.workers.values()].map((w) => ({ ...w }));
  }

  factoryCount() {
    return this.factories.size;
  }

  departmentCount() {
    return this.departments.size;
  }

  workerCount() {
    return this.workers.size;
  }

  registerFactory(factory: FactoryDefinition) {
    this.factories.set(factory.factoryId, {
      ...factory,
      responsibilities: unique(factory.responsibilities),
      reportsTo: "pillow",
    });
    return this.listFactories().find((f) => f.factoryId === factory.factoryId)!;
  }

  registerDepartment(department: DepartmentDefinition) {
    this.departments.set(department.departmentId, {
      ...department,
      responsibilities: unique(department.responsibilities),
    });
    return this.listDepartments().find((d) => d.departmentId === department.departmentId)!;
  }

  registerWorker(worker: WorkerOwnership) {
    this.workers.set(worker.workerId, { ...worker });
    return this.listWorkers().find((w) => w.workerId === worker.workerId)!;
  }

  count() {
    return this.records.size;
  }

  listRecords() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  getLatestRecord() {
    const records = this.listRecords();
    return records[records.length - 1] ?? null;
  }

  save(record: OrganizationStructureRecord) {
    this.records.set(record.structureRecordId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: OrganizationCharterInput;
    charterVersion: string;
    structureDecision: StructureDecision | string;
    factoriesRegistered: string[];
    departmentsRegistered: string[];
    workersRegistered: string[];
    reportingValidated: boolean;
    escalationValidated: boolean;
    rulesApplied: string[];
    rulesSatisfied: string[];
    rulesFailed: string[];
    validationStatus: ValidationStatus;
    structureRecordId?: string;
  }): OrganizationStructureRecord {
    structureSequence += 1;
    const structureRecordId =
      params.structureRecordId?.trim() ||
      params.input.structureRecordId?.trim() ||
      `och-sr-${Date.now()}-${structureSequence}`;
    const record: OrganizationStructureRecord = {
      structureRecordId,
      timestamp: new Date().toISOString(),
      charterVersion: params.charterVersion,
      structureDecision: params.structureDecision,
      factoriesRegistered: unique(params.factoriesRegistered),
      departmentsRegistered: unique(params.departmentsRegistered),
      workersRegistered: unique(params.workersRegistered),
      reportingValidated: params.reportingValidated,
      escalationValidated: params.escalationValidated,
      rulesApplied: unique(params.rulesApplied),
      rulesSatisfied: unique(params.rulesSatisfied),
      rulesFailed: unique(params.rulesFailed),
      metadataVersion: OCH_METADATA_VERSION,
      structureTraceId: `och-trace-${Date.now()}-${structureSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOperatingSystem: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workforceOperatingSystemReplaced: false,
      workforceOrchestratorReplaced: false,
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

let structureSequence = 0;

export function resetStructureSequenceForTesting() {
  structureSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: OrganizationStructureRecord): OrganizationStructureRecord {
  return {
    ...record,
    factoriesRegistered: [...record.factoriesRegistered],
    departmentsRegistered: [...record.departmentsRegistered],
    workersRegistered: [...record.workersRegistered],
    rulesApplied: [...record.rulesApplied],
    rulesSatisfied: [...record.rulesSatisfied],
    rulesFailed: [...record.rulesFailed],
  };
}
