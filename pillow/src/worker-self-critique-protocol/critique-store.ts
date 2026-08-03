import { WSCP_METADATA_VERSION } from "./paths.js";
import type {
  SelfCritiqueRecord,
  SubmissionDecision,
  ValidationStatus,
  WorkerSelfCritiqueProtocolInput,
} from "./types.js";

/** Authoritative in-memory Worker Self-Critique store — evaluate only. */
export class CritiqueStore {
  private records = new Map<string, SelfCritiqueRecord>();

  seed(records: SelfCritiqueRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.selfCritiqueId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  countByDecision(decision: string) {
    return this.list().filter((r) => r.submissionDecision === decision).length;
  }

  averageRevisedConfidence() {
    const records = this.list();
    if (!records.length) return 0;
    const sum = records.reduce((acc, r) => acc + r.revisedConfidenceScore, 0);
    return Math.round((sum / records.length) * 100) / 100;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(selfCritiqueId: string) {
    const record = this.records.get(selfCritiqueId);
    return record ? clone(record) : null;
  }

  save(record: SelfCritiqueRecord) {
    this.records.set(record.selfCritiqueId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: WorkerSelfCritiqueProtocolInput;
    workerId: string;
    missionId: string;
    outputReviewed: string;
    completenessScore: number;
    logicalConsistency: number;
    factualConsistency: number;
    evidenceReview: string[];
    weaknessesFound: string[];
    suggestedImprovements: string[];
    revisedConfidenceScore: number;
    submissionDecision: SubmissionDecision | string;
    checksPerformed: string[];
    checksFailed: string[];
    assumptionsIdentified: string[];
    missingEvidence: string[];
    initialConfidenceScore: number;
    revisionRequired: boolean;
    validationStatus: ValidationStatus;
    selfCritiqueId?: string;
  }): SelfCritiqueRecord {
    critiqueSequence += 1;
    const selfCritiqueId =
      params.selfCritiqueId?.trim() ||
      params.input.selfCritiqueId?.trim() ||
      `wscp-sc-${Date.now()}-${critiqueSequence}`;
    const record: SelfCritiqueRecord = {
      selfCritiqueId,
      timestamp: new Date().toISOString(),
      workerId: params.workerId,
      missionId: params.missionId,
      outputReviewed: params.outputReviewed,
      completenessScore: clamp(params.completenessScore),
      logicalConsistency: clamp(params.logicalConsistency),
      evidenceReview: unique(params.evidenceReview),
      weaknessesFound: unique(params.weaknessesFound),
      suggestedImprovements: unique(params.suggestedImprovements),
      revisedConfidenceScore: clamp(params.revisedConfidenceScore),
      submissionDecision: params.submissionDecision,
      metadataVersion: WSCP_METADATA_VERSION,
      critiqueTraceId: `wscp-trace-${Date.now()}-${critiqueSequence}`,
      validationStatus: params.validationStatus,
      checksPerformed: unique(params.checksPerformed),
      checksFailed: unique(params.checksFailed),
      factualConsistency: clamp(params.factualConsistency),
      assumptionsIdentified: unique(params.assumptionsIdentified),
      missingEvidence: unique(params.missingEvidence),
      initialConfidenceScore: clamp(params.initialConfidenceScore),
      revisionRequired: params.revisionRequired,
      neverReplacePeerReviewRuntime: true,
      neverReplaceWorkerQualityStandard: true,
      neverExecuteWorkerTasks: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      peerReviewRuntimeReplaced: false,
      workerQualityStandardReplaced: false,
      workerTasksExecuted: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveCritiqueTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let critiqueSequence = 0;

export function resetCritiqueSequenceForTesting() {
  critiqueSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clone(record: SelfCritiqueRecord): SelfCritiqueRecord {
  return {
    ...record,
    evidenceReview: [...record.evidenceReview],
    weaknessesFound: [...record.weaknessesFound],
    suggestedImprovements: [...record.suggestedImprovements],
    checksPerformed: [...record.checksPerformed],
    checksFailed: [...record.checksFailed],
    assumptionsIdentified: [...record.assumptionsIdentified],
    missingEvidence: [...record.missingEvidence],
  };
}
