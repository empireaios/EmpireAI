import { WCM_METADATA_VERSION } from "./paths.js";
import type {
  CertificationRecord,
  CertificationStatus,
  ValidationStatus,
  WorkforceCertificationMonitorInput,
} from "./types.js";

/** Authoritative in-memory Workforce Certification Monitor store — certify only. */
export class CertificationStore {
  private records = new Map<string, CertificationRecord>();
  private latestByWorker = new Map<string, string>();

  seed(records: CertificationRecord[]) {
    this.records.clear();
    this.latestByWorker.clear();
    for (const record of records) {
      this.records.set(record.certificationId, clone(record));
      this.latestByWorker.set(record.workerId, record.certificationId);
    }
  }

  count() {
    return this.records.size;
  }

  countByStatus(status: CertificationStatus | string) {
    return this.list().filter((r) => r.certificationStatus === status).length;
  }

  failureCount() {
    return this.list().filter(
      (r) =>
        r.certificationStatus === "decertified" ||
        r.certificationStatus === "suspended" ||
        r.certificationIssues.length > 0,
    ).length;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(certificationId: string) {
    const record = this.records.get(certificationId);
    return record ? clone(record) : null;
  }

  getLatestForWorker(workerId: string) {
    const id = this.latestByWorker.get(workerId);
    return id ? this.get(id) : null;
  }

  listLatestWorkers() {
    return [...this.latestByWorker.keys()]
      .map((workerId) => this.getLatestForWorker(workerId))
      .filter((r): r is CertificationRecord => r != null)
      .map(clone);
  }

  save(record: CertificationRecord) {
    this.records.set(record.certificationId, clone(record));
    this.latestByWorker.set(record.workerId, record.certificationId);
    return clone(record);
  }

  buildRecord(params: {
    input: WorkforceCertificationMonitorInput;
    workerId: string;
    workerName: string;
    department: string;
    certificationStatus: CertificationStatus | string;
    availabilityStatus: string;
    capabilityStatus: string;
    toolAccessStatus: string;
    governanceStatus: string;
    runtimeHealth: string;
    qualityCompliance: string;
    selfCritiqueCompliance: string;
    dependencyHealth: string;
    certificationIssues: string[];
    recommendedAction: string;
    checksPerformed: string[];
    checksFailed: string[];
    registered: boolean;
    reachable: boolean;
    validationStatus: ValidationStatus;
    monitorCycleId?: string | null;
    certificationId?: string;
  }): CertificationRecord {
    certificationSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `wcm-cr-${Date.now()}-${certificationSequence}`;
    const record: CertificationRecord = {
      certificationId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      workerName: params.workerName,
      department: params.department,
      certificationStatus: params.certificationStatus,
      availabilityStatus: params.availabilityStatus,
      capabilityStatus: params.capabilityStatus,
      toolAccessStatus: params.toolAccessStatus,
      governanceStatus: params.governanceStatus,
      runtimeHealth: params.runtimeHealth,
      qualityCompliance: params.qualityCompliance,
      certificationIssues: unique(params.certificationIssues),
      recommendedAction: params.recommendedAction,
      metadataVersion: WCM_METADATA_VERSION,
      certificationTraceId: `wcm-trace-${Date.now()}-${certificationSequence}`,
      validationStatus: params.validationStatus,
      checksPerformed: unique(params.checksPerformed),
      checksFailed: unique(params.checksFailed),
      selfCritiqueCompliance: params.selfCritiqueCompliance,
      dependencyHealth: params.dependencyHealth,
      registered: params.registered,
      reachable: params.reachable,
      monitorCycleId: params.monitorCycleId ?? null,
      neverExecuteWorkerTasks: true,
      neverRepairWorkersAutomatically: true,
      neverReplaceWorkerQualityStandard: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workersRepairedAutomatically: false,
      workerQualityStandardReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveCertificationTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let certificationSequence = 0;

export function resetCertificationSequenceForTesting() {
  certificationSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clone(record: CertificationRecord): CertificationRecord {
  return {
    ...record,
    certificationIssues: [...record.certificationIssues],
    checksPerformed: [...record.checksPerformed],
    checksFailed: [...record.checksFailed],
  };
}
