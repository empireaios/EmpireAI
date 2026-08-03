import { WQS_METADATA_VERSION } from "./paths.js";
import type {
  QualityDecision,
  QualityRecord,
  ValidationStatus,
  WorkerQualityStandardInput,
} from "./types.js";

/** Authoritative in-memory Worker Quality Standard store — validate only. */
export class QualityStore {
  private records = new Map<string, QualityRecord>();

  seed(records: QualityRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.qualityRecordId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  compliantCount() {
    return this.list().filter((r) => r.validationResult === "compliant").length;
  }

  nonCompliantCount() {
    return this.list().filter((r) => r.validationResult === "non_compliant").length;
  }

  averageConfidence() {
    const records = this.list();
    if (!records.length) return 0;
    const sum = records.reduce((acc, r) => acc + r.confidenceScore, 0);
    return Math.round((sum / records.length) * 100) / 100;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(qualityRecordId: string) {
    const record = this.records.get(qualityRecordId);
    return record ? clone(record) : null;
  }

  save(record: QualityRecord) {
    this.records.set(record.qualityRecordId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: WorkerQualityStandardInput;
    workerId: string;
    missionId: string;
    reasoningSummary: string;
    confidenceScore: number;
    evidence: string[];
    assumptions: string[];
    limitations: string[];
    validationResult: QualityDecision | string;
    governanceCompliance: boolean;
    uncertaintyDetected: boolean;
    standardsChecked: string[];
    standardsSatisfied: string[];
    standardsFailed: string[];
    completionReport: string;
    validationStatus: ValidationStatus;
    qualityRecordId?: string;
  }): QualityRecord {
    qualitySequence += 1;
    const qualityRecordId =
      params.qualityRecordId?.trim() ||
      params.input.qualityRecordId?.trim() ||
      `wqs-qr-${Date.now()}-${qualitySequence}`;
    const record: QualityRecord = {
      qualityRecordId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      missionId: params.missionId,
      reasoningSummary: params.reasoningSummary,
      confidenceScore: clampScore(params.confidenceScore),
      evidence: unique(params.evidence),
      assumptions: unique(params.assumptions),
      limitations: unique(params.limitations),
      validationResult: params.validationResult,
      governanceCompliance: params.governanceCompliance,
      metadataVersion: WQS_METADATA_VERSION,
      qualityTraceId: `wqs-trace-${Date.now()}-${qualitySequence}`,
      validationStatus: params.validationStatus,
      uncertaintyDetected: params.uncertaintyDetected,
      standardsChecked: unique(params.standardsChecked),
      standardsSatisfied: unique(params.standardsSatisfied),
      standardsFailed: unique(params.standardsFailed),
      completionReport: params.completionReport,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerImplementations: true,
      neverReplacePeerReviewRuntime: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workerImplementationsReplaced: false,
      peerReviewRuntimeReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveQualityTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let qualitySequence = 0;

export function resetQualitySequenceForTesting() {
  qualitySequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clone(record: QualityRecord): QualityRecord {
  return {
    ...record,
    evidence: [...record.evidence],
    assumptions: [...record.assumptions],
    limitations: [...record.limitations],
    standardsChecked: [...record.standardsChecked],
    standardsSatisfied: [...record.standardsSatisfied],
    standardsFailed: [...record.standardsFailed],
  };
}
