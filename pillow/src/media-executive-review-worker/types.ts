import type { MediaExecutiveReviewWorkerConfiguration } from "./configuration.js";
import type {
  EDITORIAL_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXECUTIVE_RECOMMENDATIONS,
  FINDING_CATEGORIES,
  FINDING_KINDS,
  FINDING_SEVERITIES,
  INTEGRATION_TARGETS,
  MER_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ExecutiveRecommendation = (typeof EXECUTIVE_RECOMMENDATIONS)[number];
export type FindingKind = (typeof FINDING_KINDS)[number];
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MediaExecutiveReviewWorkerCapability = (typeof MER_CAPABILITIES)[number];

export type ReviewFinding = {
  findingId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  summary: string;
  kind: FindingKind;
  evidenceRefs: string[];
};

export type AssetCompleteness = {
  scriptReady: boolean;
  thumbnailReady: boolean;
  visualAssetsReady: boolean;
  voiceReady: boolean;
  subtitleReady: boolean;
  publishingPackageReady: boolean;
  analyticsTraceable: boolean;
  learningTraceable: boolean;
  completenessScore: number;
  missingItems: string[];
};

export type QualityAssessment = {
  overallQualityScore: number;
  editorialScore: number;
  scriptScore: number;
  thumbnailScore: number;
  visualScore: number;
  voiceSubtitleScore: number;
  notes: string;
};

export type ComplianceAssessment = {
  editorialCompliant: boolean;
  pillowGovernanceIntact: boolean;
  prerequisiteWorkersComplete: boolean;
  approvedAssetsUnmodified: boolean;
  complianceScore: number;
  notes: string;
};

export type SupportingEvidenceItem = {
  evidenceId: string;
  sourceType: string;
  sourceRef: string;
  statement: string;
  kind: FindingKind;
};

export type PrerequisiteWorkerStatus = {
  workerKey: string;
  completed: boolean;
  reportId: string | null;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type PublishingSignal = {
  publishingReportId?: string;
  mediaId?: string;
  channelId?: string;
  publishingReadinessStatus?: string;
  title?: string;
  tagsCount?: number;
};

export type AnalyticsSignal = {
  analyticsReportId?: string;
  mediaId?: string;
  channelId?: string;
  confidenceScore?: number;
};

export type LearningSignal = {
  learningReportId?: string;
  channelId?: string;
  confidenceScore?: number;
};

export type PrerequisiteStatusInput = {
  workerKey: string;
  completed?: boolean;
  reportId?: string | null;
};

/** Machine-readable Media Executive Review Report (Q4-18). */
export type MediaExecutiveReviewReport = {
  reviewId: string;
  timestamp: string;
  mediaId: string;
  channelId: string;
  editorialStatus: EditorialStatus;
  assetCompleteness: AssetCompleteness;
  qualityAssessment: QualityAssessment;
  complianceAssessment: ComplianceAssessment;
  outstandingIssues: ReviewFinding[];
  executiveRecommendation: ExecutiveRecommendation;
  recommendationRationale: string;
  supportingEvidence: SupportingEvidenceItem[];
  confidenceScore: number;
  metadataVersion: string;
  workerId: string;
  reportVersion: string;
  mediaBusinessId?: string | null;
  publishingReportId?: string | null;
  analyticsReportId?: string | null;
  learningReportId?: string | null;
  scriptId?: string | null;
  thumbnailReportId?: string | null;
  assemblyId?: string | null;
  prerequisiteWorkerStatuses: PrerequisiteWorkerStatus[];
  verifiedFindings: ReviewFinding[];
  recommendationFindings: ReviewFinding[];
  sourceTraceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  neverPublishMedia: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverRewriteScripts: true;
  neverEditMediaAssets: true;
  neverModifyApprovedAssets: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ419OrLater: true;
  neverBypassPillowGovernance: true;
  verifyAllPrerequisiteWorkersCompletedSuccessfully: true;
  preserveCompleteTraceability: true;
  distinguishVerifiedFindingsFromRecommendations: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type MediaExecutiveReviewWorkerInput = {
  reviewId?: string | null;
  mediaId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  scriptId?: string | null;
  thumbnailReportId?: string | null;
  assemblyId?: string | null;
  publishingReportId?: string | null;
  analyticsReportId?: string | null;
  learningReportId?: string | null;
  editorialApproved?: boolean | null;
  scriptQualityScore?: number | null;
  thumbnailQualityScore?: number | null;
  visualAssetReady?: boolean | null;
  voiceReady?: boolean | null;
  subtitleReady?: boolean | null;
  publishingPackageComplete?: boolean | null;
  analyticsTraceable?: boolean | null;
  learningTraceable?: boolean | null;
  prerequisiteStatuses?: PrerequisiteStatusInput[] | null;
  publishingSignals?: PublishingSignal[] | null;
  analyticsSignals?: AnalyticsSignal[] | null;
  learningSignals?: LearningSignal[] | null;
  outstandingIssueHints?: string[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  publishMedia?: boolean;
  rewriteScripts?: boolean;
  editMediaAssets?: boolean;
  modifyApprovedAssets?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ419OrLater?: boolean;
  bypassPillowGovernance?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MediaExecutiveReviewWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MediaExecutiveReviewWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MER-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MediaExecutiveReviewWorkerCapability[];
  totalReviewReports: number;
  lastReviewId: string | null;
  lastMediaId: string | null;
  lastChannelId: string | null;
  lastExecutiveRecommendation: ExecutiveRecommendation | null;
  lastNeverPublishMedia: boolean | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MediaExecutiveReviewWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reviewReports: MediaExecutiveReviewReport[];
  integrations: IntegrationHandshake[];
  executiveRecommendations: ExecutiveRecommendation[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPublishMedia: true;
  neverRewriteScripts: true;
  neverEditMediaAssets: true;
  neverModifyApprovedAssets: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ419OrLater: true;
  neverBypassPillowGovernance: true;
  verifyAllPrerequisiteWorkersCompletedSuccessfully: true;
  preserveCompleteTraceability: true;
  distinguishVerifiedFindingsFromRecommendations: true;
  preserveAuditHistory: true;
};

export type MediaExecutiveReviewWorkerRunReport = {
  reviewRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_all_completed_media_factory_outputs"
    | "verify_editorial_compliance"
    | "verify_script_quality"
    | "verify_thumbnail_quality"
    | "verify_visual_asset_readiness"
    | "verify_voice_and_subtitle_readiness"
    | "verify_publishing_package_completeness"
    | "verify_analytics_and_learning_traceability"
    | "identify_outstanding_issues"
    | "recommend_approve_revise_or_reject"
    | "produce_media_executive_review_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MediaExecutiveReviewWorkerEngineRecord;
  catalog: MediaExecutiveReviewWorkerCatalog | null;
  reviewReports: MediaExecutiveReviewReport[];
  latestReviewReport: MediaExecutiveReviewReport | null;
  integrations: IntegrationHandshake[];
  validation: MediaExecutiveReviewWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MediaExecutiveReviewWorkerState = {
  engineVersion: "PILLOW-MER-001";
  missionId: "Q4-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: MediaExecutiveReviewWorkerConfiguration;
  latestReport: MediaExecutiveReviewWorkerRunReport | null;
  engineRecord: MediaExecutiveReviewWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReviewReports: number;
    lastReviewId: string | null;
    lastMediaId: string | null;
    lastChannelId: string | null;
    lastExecutiveRecommendation: ExecutiveRecommendation | null;
    lastNeverPublishMedia: boolean | null;
    notes: string[];
  };
};

export type MediaExecutiveReviewWorkerCockpitSnapshot = {
  missionId: "Q4-18";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReviewReports: number;
  latestReviewId: string | null;
  lastMediaId: string | null;
  lastChannelId: string | null;
  lastExecutiveRecommendation: ExecutiveRecommendation | null;
  lastNeverPublishMedia: boolean | null;
  workerId: string;
  neverPublishMedia: true;
  neverRewriteScripts: true;
  neverEditMediaAssets: true;
  neverModifyApprovedAssets: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ419OrLater: true;
  neverBypassPillowGovernance: true;
  verifyAllPrerequisiteWorkersCompletedSuccessfully: true;
  preserveCompleteTraceability: true;
  distinguishVerifiedFindingsFromRecommendations: true;
};

export type ReviewContext = {
  mediaId?: string | null;
  channelId?: string | null;
  mediaBusinessId?: string | null;
  scriptId?: string | null;
  thumbnailReportId?: string | null;
  assemblyId?: string | null;
  publishingReportId?: string | null;
  analyticsReportId?: string | null;
  learningReportId?: string | null;
  editorialApproved?: boolean | null;
  scriptQualityScore?: number | null;
  thumbnailQualityScore?: number | null;
  visualAssetReady?: boolean | null;
  voiceReady?: boolean | null;
  subtitleReady?: boolean | null;
  publishingPackageComplete?: boolean | null;
  analyticsTraceable?: boolean | null;
  learningTraceable?: boolean | null;
  prerequisiteStatuses?: PrerequisiteWorkerStatus[];
  publishingSignals?: PublishingSignal[];
  analyticsSignals?: AnalyticsSignal[];
  learningSignals?: LearningSignal[];
  outstandingIssueHints?: string[];
  receivedOutputs?: boolean;
  editorialStatus?: EditorialStatus;
  assetCompleteness?: AssetCompleteness;
  qualityAssessment?: QualityAssessment;
  complianceAssessment?: ComplianceAssessment;
  outstandingIssues?: ReviewFinding[];
  verifiedFindings?: ReviewFinding[];
  recommendationFindings?: ReviewFinding[];
  executiveRecommendation?: ExecutiveRecommendation;
};
