import { PRR_METADATA_VERSION } from "./paths.js";
import type {
  EscalationStatus,
  ImpactLevel,
  IndependentReview,
  PeerReviewRecord,
  PeerReviewRuntimeInput,
  ReviewFinding,
  ReviewOutcome,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Peer Review Runtime store — validate only. */
export class PeerReviewStore {
  private records = new Map<string, PeerReviewRecord>();

  seed(records: PeerReviewRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.reviewId, clone(record));
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

  get(reviewId: string) {
    const record = this.records.get(reviewId);
    return record ? clone(record) : null;
  }

  save(record: PeerReviewRecord) {
    this.records.set(record.reviewId, clone(record));
    return clone(record);
  }

  buildRecord(params: {
    input: PeerReviewRuntimeInput;
    reviewers: string[];
    findings: ReviewFinding[];
    agreementLevel: number;
    issuesFound: string[];
    requiredRevisions: string[];
    outcome: ReviewOutcome;
    escalationStatus: EscalationStatus;
    peerReviewRequired: boolean;
    independentReviews: IndependentReview[];
    disagreements: string[];
    impactLevel: ImpactLevel | string;
    validationStatus: ValidationStatus;
  }): PeerReviewRecord {
    reviewSequence += 1;
    const reviewId = params.input.reviewId?.trim() || `prr-rev-${Date.now()}-${reviewSequence}`;
    const record: PeerReviewRecord = {
      reviewId,
      timestamp: new Date().toISOString(),
      missionId: params.input.missionId?.trim() || "mission-unspecified",
      taskId: params.input.taskId?.trim() || `task-${reviewSequence}`,
      originalWorker: params.input.originalWorker?.trim() || "worker-unspecified",
      reviewers: unique(params.reviewers),
      reviewFindings: params.findings.map((f) => ({ ...f })),
      agreementLevel: clamp(params.agreementLevel),
      issuesFound: unique(params.issuesFound),
      requiredRevisions: unique(params.requiredRevisions),
      reviewOutcome: params.outcome,
      escalationStatus: params.escalationStatus,
      metadataVersion: PRR_METADATA_VERSION,
      reviewTraceId: `prr-trace-${Date.now()}-${reviewSequence}`,
      validationStatus: params.validationStatus,
      impactLevel: params.impactLevel,
      peerReviewRequired: params.peerReviewRequired,
      independentReviews: params.independentReviews.map((ir) => ({
        ...ir,
        findings: [...ir.findings],
        issues: [...ir.issues],
        criteriaScores: { ...ir.criteriaScores },
      })),
      disagreements: unique(params.disagreements),
      neverReplaceWorkers: true,
      neverRewriteCompletedWork: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverExecuteBusinessTasks: true,
      workersReplaced: false,
      completedWorkRewritten: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      businessTasksExecuted: false,
      preserveReviewTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(record);
  }
}

let reviewSequence = 0;

export function resetReviewSequenceForTesting() {
  reviewSequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clone(record: PeerReviewRecord): PeerReviewRecord {
  return {
    ...record,
    reviewers: [...record.reviewers],
    reviewFindings: record.reviewFindings.map((f) => ({ ...f })),
    issuesFound: [...record.issuesFound],
    requiredRevisions: [...record.requiredRevisions],
    independentReviews: record.independentReviews.map((ir) => ({
      ...ir,
      findings: [...ir.findings],
      issues: [...ir.issues],
      criteriaScores: { ...ir.criteriaScores },
    })),
    disagreements: [...record.disagreements],
  };
}
