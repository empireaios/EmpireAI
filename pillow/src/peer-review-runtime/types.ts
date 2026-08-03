import type { PeerReviewRuntimeConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  ESCALATION_STATUSES,
  HEALTH_STATUSES,
  IMPACT_LEVELS,
  OPERATIONAL_STATES,
  PRR_CAPABILITIES,
  REVIEW_CRITERIA,
  REVIEW_OUTCOMES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];
export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number];
export type PeerReviewRuntimeCapability = (typeof PRR_CAPABILITIES)[number];

export type ReviewerCandidate = {
  workerId: string;
  qualificationScore: number;
  available: boolean;
  specialties: string[];
};

export type IndependentReview = {
  reviewerId: string;
  recommendedOutcome: ReviewOutcome | string;
  agreementScore: number;
  findings: string[];
  issues: string[];
  criteriaScores: Partial<Record<ReviewCriterion | string, number>>;
};

export type ReviewFinding = {
  criterion: ReviewCriterion | string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
};

/** Machine-readable Peer Review Record (Q0-21). */
export type PeerReviewRecord = {
  reviewId: string;
  timestamp: string;
  missionId: string;
  taskId: string;
  originalWorker: string;
  reviewers: string[];
  reviewFindings: ReviewFinding[];
  agreementLevel: number;
  issuesFound: string[];
  requiredRevisions: string[];
  reviewOutcome: ReviewOutcome;
  escalationStatus: EscalationStatus;
  metadataVersion: string;
  reviewTraceId: string;
  validationStatus: ValidationStatus;
  impactLevel: ImpactLevel | string;
  peerReviewRequired: boolean;
  independentReviews: IndependentReview[];
  disagreements: string[];
  /** Explicit Q0-21 boundaries. */
  neverReplaceWorkers: true;
  neverRewriteCompletedWork: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExecuteBusinessTasks: true;
  workersReplaced: false;
  completedWorkRewritten: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  businessTasksExecuted: false;
  preserveReviewTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-21 — coordinate/validate only. */
export type PeerReviewRuntimeInput = {
  reviewId?: string | null;
  missionId?: string | null;
  taskId?: string | null;
  originalWorker?: string | null;
  impactLevel?: ImpactLevel | string | null;
  workSummary?: string | null;
  reviewerCandidates?: ReviewerCandidate[];
  independentReviews?: IndependentReview[];
  forceEscalate?: boolean;
  forceRevision?: boolean;
  skipReview?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  replaceWorkers?: boolean;
  rewriteCompletedWork?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  executeBusinessTasks?: boolean;
};

export type PeerReviewRuntimeValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PeerReviewRuntimeEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PRR-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PeerReviewRuntimeCapability[];
  totalReviewRecords: number;
  lastOutcome: ReviewOutcome | null;
  metadataVersion: string;
};

export type PeerReviewRuntimeRunReport = {
  reviewRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_work"
    | "determine_required"
    | "select_reviewers"
    | "deliver_to_reviewers"
    | "collect_reviews"
    | "compare_reviews"
    | "request_revision"
    | "escalate"
    | "review"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: PeerReviewRuntimeEngineRecord;
  records: PeerReviewRecord[];
  selectedReviewers: string[];
  peerReviewRequired: boolean;
  agreementLevel: number | null;
  disagreements: string[];
  escalationStatus: EscalationStatus | null;
  validation: PeerReviewRuntimeValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PeerReviewRuntimeState = {
  engineVersion: "PILLOW-PRR-001";
  missionId: "Q0-21";
  status: EngineStatus;
  initializedAt: string;
  configuration: PeerReviewRuntimeConfiguration;
  latestReport: PeerReviewRuntimeRunReport | null;
  engineRecord: PeerReviewRuntimeEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReviewRecords: number;
    lastOutcome: ReviewOutcome | null;
    notes: string[];
  };
};

export type PeerReviewRuntimeCockpitSnapshot = {
  missionId: "Q0-21";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalReviewRecords: number;
  latestReviewId: string | null;
  lastOutcome: ReviewOutcome | null;
  neverReplaceWorkers: true;
  neverRewriteCompletedWork: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExecuteBusinessTasks: true;
};
