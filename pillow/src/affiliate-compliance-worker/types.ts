import type {
  ACW_METADATA_VERSION,
  AFFILIATE_COMPLIANCE_WORKER_IDENTITY,
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FINDING_SEVERITIES,
  OPERATIONAL_STATES,
  READINESS_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AffiliateComplianceWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];

/** Evidenced compliance signals only — missing fields stay null/unknown, never invented. */
export type ComplianceEvidenceSnapshot = {
  disclosurePresent?: boolean | null;
  disclosureText?: string | null;
  disclosurePlacement?: "above_fold" | "inline" | "footer" | "missing" | "unknown" | null;
  requiredDisclaimerPresent?: boolean | null;
  disclaimerText?: string | null;
  linkDisclosurePresent?: boolean | null;
  platform?: string | null;
  platformRulesAcknowledged?: boolean | null;
  promotionalClaims?: string[] | null;
  prohibitedClaimsDetected?: string[] | null;
  contentMentionsAffiliateRelationship?: boolean | null;
  reviewHasProsCons?: boolean | null;
  seoHasDisclosureSection?: boolean | null;
  programmeRequirementsReferenced?: boolean | null;
};

export type OpportunityFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  opportunityScore?: number | null;
  productCategory?: string;
  programmeName?: string | null;
};

export type ReviewFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  title?: string;
  disclosurePresent?: boolean | null;
  buyingRecommendation?: string | null;
};

export type SeoFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  topic?: string;
  hasDisclosureSection?: boolean | null;
  contentQualitySummary?: { completenessScore?: number };
};

export type AnalyticsFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  confidenceScore?: number | null;
};

export type ComplianceScope = {
  scopeId: string;
  affiliateProjectId: string;
  platforms: string[];
  frameworks: string[];
  evidencePresent: boolean;
  fabricated: false;
};

export type DisclosureValidation = {
  validationId: string;
  status: CheckStatus;
  disclosurePresent: boolean | null;
  disclosureTextObserved: boolean;
  placement: string | null;
  linkDisclosurePresent: boolean | null;
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
  legalConclusion: "not_legal_advice";
};

export type PlatformRuleValidation = {
  validationId: string;
  status: CheckStatus;
  platform: string | null;
  rulesAcknowledged: boolean | null;
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
  legalConclusion: "not_legal_advice";
};

export type DisclaimerValidation = {
  validationId: string;
  status: CheckStatus;
  requiredDisclaimerPresent: boolean | null;
  disclaimerTextObserved: boolean;
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
  legalConclusion: "not_legal_advice";
};

export type PolicyFinding = {
  findingId: string;
  area: "disclosure" | "disclaimer" | "platform" | "promotional_claim" | "link" | "content" | "general";
  severity: FindingSeverity;
  summary: string;
  evidencePresent: boolean;
  fabricated: false;
  legalConclusion: "not_legal_advice";
};

export type ComplianceRisk = {
  riskId: string;
  category: string;
  severity: FindingSeverity;
  score: number | null;
  detail: string;
  evidencePresent: boolean;
  fabricated: false;
  legalConclusion: "not_legal_advice";
};

export type RecommendedCorrection = {
  correctionId: string;
  area: string;
  recommendation: string;
  rationale: string;
  priority: "low" | "medium" | "high" | "critical";
  fabricated: false;
  evidencePresent: boolean;
  legalConclusion: "not_legal_advice";
};

export type ReadinessAssessment = {
  assessmentId: string;
  status: ReadinessStatus;
  riskScore: number | null;
  blockers: string[];
  notes: string[];
  fabricated: false;
  evidencePresent: boolean;
  autoApproved: false;
  legalConclusion: "not_legal_advice";
};

export type HistoryEntry = {
  entryId: string;
  reportId: string;
  timestamp: string;
  readinessStatus: ReadinessStatus;
  riskScore: number | null;
  findingCount: number;
};

export type AffiliateComplianceReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  complianceScope: ComplianceScope;
  disclosureValidation: DisclosureValidation;
  platformRuleValidation: PlatformRuleValidation;
  disclaimerValidation: DisclaimerValidation;
  policyFindings: PolicyFinding[];
  complianceRisks: ComplianceRisk[];
  recommendedCorrections: RecommendedCorrection[];
  readinessStatus: ReadinessStatus;
  readinessAssessment: ReadinessAssessment;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof ACW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  history: HistoryEntry[];
  supportingEvidence: string[];
  sourceOpportunityReportId: string | null;
  sourceReviewReportId: string | null;
  sourceSeoReportId: string | null;
  sourceAnalyticsReportId: string | null;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ809: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveComplianceAuditHistory: true;
  neverFabricateComplianceResults: true;
  neverProvideUnverifiedLegalConclusions: true;
  neverPublishAffiliateContent: true;
  neverReplaceLegalProfessionals: true;
  neverOverrideProgrammeRequirements: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ809OrLater: true;
  legalConclusion: "not_legal_advice";
};

export type AcwInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  complianceEvidence?: ComplianceEvidenceSnapshot | null;
  fixtureEvidence?: ComplianceEvidenceSnapshot | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  reviewReport?: ReviewFixture | null;
  fixtureReview?: ReviewFixture | null;
  seoReport?: SeoFixture | null;
  fixtureSeo?: SeoFixture | null;
  analyticsReport?: AnalyticsFixture | null;
  fixtureAnalytics?: AnalyticsFixture | null;
  frameworks?: string[] | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateComplianceResults?: boolean;
  provideUnverifiedLegalConclusions?: boolean;
  publishAffiliateContent?: boolean;
  replaceLegalProfessionals?: boolean;
  overrideProgrammeRequirements?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ809OrLater?: boolean;
  missionId?: string | null;
};

export type AcwRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: AffiliateComplianceReport | null;
  complianceScope?: ComplianceScope | null;
  disclosureValidation?: DisclosureValidation | null;
  platformRuleValidation?: PlatformRuleValidation | null;
  disclaimerValidation?: DisclaimerValidation | null;
  policyFindings?: PolicyFinding[];
  complianceRisks?: ComplianceRisk[];
  recommendedCorrections?: RecommendedCorrection[];
  readinessAssessment?: ReadinessAssessment | null;
  history?: HistoryEntry[];
  notes: string[];
};

export type AffiliateComplianceWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalHistoryEntries: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type AffiliateComplianceWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalHistoryEntries: number;
};

export type AffiliateComplianceWorkerCockpitSnapshot = {
  missionId: "Q8-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalHistoryEntries: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateComplianceResults: true;
  neverProvideUnverifiedLegalConclusions: true;
  neverPublishAffiliateContent: true;
  neverReplaceLegalProfessionals: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ809OrLater: true;
  consumableByQ809: true;
};

export type AffiliateComplianceWorkerState = {
  engineVersion: "PILLOW-ACW-001";
  missionId: "Q8-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: AffiliateComplianceWorkerConfiguration;
  latestReport: AffiliateComplianceReport | null;
  engineRecord: AffiliateComplianceWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalHistoryEntries: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q809ConsumableContract = {
  contractVersion: "ACW-Q809-v1";
  consumableByQ809: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateComplianceResults: true;
  neverProvideUnverifiedLegalConclusions: true;
  neverPublishAffiliateContent: true;
  neverReplaceLegalProfessionals: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type ComplianceSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  sourceOpportunityReportId: string | null;
  sourceReviewReportId: string | null;
  sourceSeoReportId: string | null;
  sourceAnalyticsReportId: string | null;
  evidence: ComplianceEvidenceSnapshot | null;
  complianceScope: ComplianceScope | null;
  disclosureValidation: DisclosureValidation | null;
  platformRuleValidation: PlatformRuleValidation | null;
  disclaimerValidation: DisclaimerValidation | null;
  policyFindings: PolicyFinding[];
  complianceRisks: ComplianceRisk[];
  recommendedCorrections: RecommendedCorrection[];
  readinessAssessment: ReadinessAssessment | null;
  outstandingIssues: string[];
  frameworks: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof AFFILIATE_COMPLIANCE_WORKER_IDENTITY;
