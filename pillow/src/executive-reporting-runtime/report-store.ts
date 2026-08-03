import { ERT_METADATA_VERSION } from "./paths.js";
import type {
  CompletionStatus,
  EntityType,
  ExecutiveReportingRuntimeInput,
  ReportRecord,
  ReportType,
  ReportingFrequency,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Executive Reporting store — report only. */
export class ReportStore {
  private records = new Map<string, ReportRecord>();

  seed(records: ReportRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.reportId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  countByEntity(entityType: string) {
    return this.list().filter((r) => r.entityType === entityType).length;
  }

  openBlockers() {
    return unique(this.list().flatMap((r) => r.blockers));
  }

  openRisks() {
    return unique(this.list().flatMap((r) => r.risks));
  }

  averageProgress() {
    const records = this.list();
    if (!records.length) return 0;
    const sum = records.reduce((acc, r) => acc + r.progress, 0);
    return Math.round((sum / records.length) * 100) / 100;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(reportId: string) {
    const record = this.records.get(reportId);
    return record ? clone(record) : null;
  }

  save(record: ReportRecord) {
    this.records.set(record.reportId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: ExecutiveReportingRuntimeInput;
    reportingEntity: string;
    entityType: EntityType | string;
    businessId: string;
    missionId: string;
    currentStatus: string;
    progress: number;
    blockers: string[];
    risks: string[];
    evidence: string[];
    nextAction: string;
    completionStatus: CompletionStatus;
    reportType: ReportType | string;
    reportingFrequency: ReportingFrequency | string;
    validationStatus: ValidationStatus;
    reportId?: string;
  }): ReportRecord {
    reportSequence += 1;
    const reportId =
      params.reportId?.trim() ||
      params.input.reportId?.trim() ||
      `ert-rpt-${Date.now()}-${reportSequence}`;
    const record: ReportRecord = {
      reportId,
      timestamp: new Date().toISOString(),
      reportingEntity: params.reportingEntity,
      entityType: params.entityType,
      businessId: params.businessId,
      missionId: params.missionId,
      currentStatus: params.currentStatus,
      progress: clampProgress(params.progress),
      blockers: unique(params.blockers),
      risks: unique(params.risks),
      evidence: unique(params.evidence),
      nextAction: params.nextAction,
      completionStatus: params.completionStatus,
      metadataVersion: ERT_METADATA_VERSION,
      reportType: params.reportType,
      reportingFrequency: params.reportingFrequency,
      reportTraceId: `ert-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      neverExecuteWorkerLogic: true,
      neverReplaceMonitoringRuntime: true,
      neverReplaceMissionCoordination: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerLogicExecuted: false,
      monitoringRuntimeReplaced: false,
      missionCoordinationReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveReportingTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let reportSequence = 0;

export function resetReportSequenceForTesting() {
  reportSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clone(record: ReportRecord): ReportRecord {
  return {
    ...record,
    blockers: [...record.blockers],
    risks: [...record.risks],
    evidence: [...record.evidence],
  };
}
