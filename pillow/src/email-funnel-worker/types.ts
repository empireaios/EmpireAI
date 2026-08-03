import type {
  AUDIT_STATUSES,
  EFW_METADATA_VERSION,
  EMAIL_FUNNEL_WORKER_IDENTITY,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FUNNEL_STAGE_TYPES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { EmailFunnelWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type FunnelStageType = (typeof FUNNEL_STAGE_TYPES)[number];

export type OpportunityFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  programmeName?: string;
  productCategory?: string;
  targetNiche?: string;
  opportunityScore?: number | null;
  products?: Array<{ productId: string; name: string; category: string; programmeId?: string }>;
};

export type SeoFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  topic?: string;
  contentPlan?: {
    title?: string;
    pillarPage?: string;
    supportingArticles?: string[];
    targetKeywords?: string[];
  };
  articleBrief?: {
    title?: string;
    primaryKeyword?: string;
    audience?: string;
  };
  seoArticle?: {
    title?: string;
    primaryKeyword?: string;
    metaDescription?: string;
  };
  targetKeywords?: Array<{ keyword: string; intent?: string; role?: string }>;
};

export type ReviewFixture = {
  reportId?: string;
  productOrServiceReviewed?: string;
  pros?: string[];
  cons?: string[];
  buyingRecommendation?: { verdict?: string; summary?: string };
};

export type LeadMagnet = {
  magnetId: string;
  name: string;
  format: "checklist" | "guide" | "comparison_sheet" | "mini_course" | "unknown";
  topic: string;
  offerSummary: string;
  deliveryPromise: string;
  evidenceBasis: string[];
  fabricated: false;
};

export type EmailCaptureStrategy = {
  strategyId: string;
  optInPageConcept: string;
  headline: string;
  formFields: string[];
  incentive: string;
  placementNotes: string[];
  fabricated: false;
};

export type FunnelStage = {
  stageId: string;
  stageType: FunnelStageType;
  name: string;
  objective: string;
  entryCriteria: string;
  exitCriteria: string;
  order: number;
};

export type EmailMessage = {
  emailId: string;
  sequenceType: "welcome" | "nurture" | "recommend" | "promo" | "followup" | "reengage";
  dayOffset: number;
  subject: string;
  previewText: string;
  bodyOutline: string[];
  cta: string;
  fabricated: false;
};

export type EmailSequence = {
  sequenceId: string;
  name: string;
  sequenceType: EmailMessage["sequenceType"];
  emails: EmailMessage[];
  fabricated: false;
};

export type CallToActionStrategy = {
  strategyId: string;
  primaryCta: string;
  secondaryCtas: string[];
  placementByStage: Array<{ stageType: FunnelStageType; cta: string }>;
  conversionObjectives: string[];
  fabricated: false;
  neverFabricatePerformanceClaims: true;
};

export type FunnelVersionEntry = {
  version: number;
  funnelId: string;
  reportId: string | null;
  timestamp: string;
  changeSummary: string;
};

export type EmailFunnelReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  funnelName: string;
  leadMagnet: LeadMagnet;
  funnelStages: FunnelStage[];
  emailSequence: EmailSequence[];
  callToActionStrategy: CallToActionStrategy;
  conversionObjectives: string[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof EFW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  topic: string;
  emailCaptureStrategy: EmailCaptureStrategy;
  welcomeSequence: EmailSequence;
  nurtureSequence: EmailSequence;
  versionHistory: FunnelVersionEntry[];
  sourceOpportunityReportId: string | null;
  sourceSeoReportId: string | null;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ807: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverFabricateConversionOrPerformanceClaims: true;
  neverSendLiveMarketingEmails: true;
  neverManageEmailInfrastructure: true;
  neverReplaceAnalyticsWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ807OrLater: true;
};

export type EfwInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  funnelName?: string | null;
  topic?: string | null;
  productCategory?: string | null;
  niche?: string | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  seoReport?: SeoFixture | null;
  fixtureSeo?: SeoFixture | null;
  reviewReport?: ReviewFixture | null;
  fixtureReview?: ReviewFixture | null;
  fixtureLeadMagnetName?: string | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateConversionOrPerformanceClaims?: boolean;
  sendLiveMarketingEmails?: boolean;
  manageEmailInfrastructure?: boolean;
  replaceAnalyticsWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ807OrLater?: boolean;
  missionId?: string | null;
};

export type EfwRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: EmailFunnelReport | null;
  leadMagnet?: LeadMagnet | null;
  emailCaptureStrategy?: EmailCaptureStrategy | null;
  funnelStages?: FunnelStage[];
  welcomeSequence?: EmailSequence | null;
  nurtureSequence?: EmailSequence | null;
  emailSequence?: EmailSequence[];
  callToActionStrategy?: CallToActionStrategy | null;
  versionHistory?: FunnelVersionEntry[];
  notes: string[];
};

export type EmailFunnelWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalFunnels: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type EmailFunnelWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalFunnels: number;
};

export type EmailFunnelWorkerCockpitSnapshot = {
  missionId: "Q8-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalFunnels: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateConversionOrPerformanceClaims: true;
  neverSendLiveMarketingEmails: true;
  neverManageEmailInfrastructure: true;
  neverReplaceAnalyticsWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ807OrLater: true;
  consumableByQ807: true;
};

export type EmailFunnelWorkerState = {
  engineVersion: "PILLOW-EFW-001";
  missionId: "Q8-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmailFunnelWorkerConfiguration;
  latestReport: EmailFunnelReport | null;
  engineRecord: EmailFunnelWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalFunnels: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q807ConsumableContract = {
  contractVersion: "EFW-Q807-v1";
  consumableByQ807: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateConversionOrPerformanceClaims: true;
  neverSendLiveMarketingEmails: true;
  neverManageEmailInfrastructure: true;
  neverReplaceAnalyticsWorker: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type FunnelSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  funnelName: string;
  topic: string;
  sourceOpportunityReportId: string | null;
  sourceSeoReportId: string | null;
  leadMagnet: LeadMagnet | null;
  emailCaptureStrategy: EmailCaptureStrategy | null;
  funnelStages: FunnelStage[];
  welcomeSequence: EmailSequence | null;
  nurtureSequence: EmailSequence | null;
  emailSequence: EmailSequence[];
  callToActionStrategy: CallToActionStrategy | null;
  conversionObjectives: string[];
  versionHistory: FunnelVersionEntry[];
  outstandingIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof EMAIL_FUNNEL_WORKER_IDENTITY;
