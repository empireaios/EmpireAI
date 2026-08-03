import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SEARCH_INTENTS,
  SEOW_METADATA_VERSION,
  SEO_CONTENT_WORKER_IDENTITY,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SeoContentWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type SearchIntent = (typeof SEARCH_INTENTS)[number];

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

export type ReviewFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  productId?: string;
  productOrServiceReviewed?: string;
  reviewSummary?: string;
  pros?: string[];
  cons?: string[];
  reviewArticle?: {
    title?: string;
    summary?: string;
    keyFeatures?: string[];
    faqs?: Array<{ question: string; answer: string }>;
    sections?: Array<{ heading: string; body: string }>;
  };
  buyingRecommendation?: {
    verdict?: string;
    summary?: string;
  };
};

export type KeywordSeed = {
  keyword: string;
  intent?: SearchIntent | string;
  cluster?: string;
  primary?: boolean;
};

export type KeywordMappingEntry = {
  keyword: string;
  intent: SearchIntent;
  cluster: string;
  role: "primary" | "secondary" | "supporting";
  fabricated: false;
  evidencePresent: boolean;
};

export type ContentCluster = {
  clusterId: string;
  name: string;
  pillarTopic: string;
  supportingTopics: string[];
};

export type SeoContentPlan = {
  planId: string;
  title: string;
  topic: string;
  pillarPage: string;
  clusters: ContentCluster[];
  supportingArticles: string[];
  targetKeywords: string[];
  searchIntent: SearchIntent;
  notes: string[];
  fabricated: false;
};

export type ArticleBrief = {
  briefId: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  audience: string;
  outline: string[];
  metaTitle: string;
  metaDescription: string;
  faqPrompts: string[];
  evidenceNotes: string[];
  fabricated: false;
};

export type SeoArticle = {
  articleId: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  headingStructure: string[];
  bodySections: Array<{ heading: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  wordCountEstimate: number;
  version: number;
  fabricated: false;
};

export type InternalLinkRecommendation = {
  linkId: string;
  fromPage: string;
  toPage: string;
  anchorText: string;
  reason: string;
  fabricated: false;
  evidencePresent: boolean;
};

export type ContentQualitySummary = {
  summaryId: string;
  completenessScore: number;
  hasPlan: boolean;
  hasBrief: boolean;
  hasArticle: boolean;
  hasKeywordMapping: boolean;
  hasInternalLinks: boolean;
  hasMeta: boolean;
  issues: string[];
  notes: string[];
};

export type ContentVersionEntry = {
  version: number;
  articleId: string;
  reportId: string | null;
  timestamp: string;
  changeSummary: string;
};

export type SeoContentReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  contentPlan: SeoContentPlan;
  targetKeywords: KeywordMappingEntry[];
  searchIntent: SearchIntent;
  articleBrief: ArticleBrief;
  seoArticle: SeoArticle;
  internalLinkingPlan: InternalLinkRecommendation[];
  contentQualitySummary: ContentQualitySummary;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof SEOW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  topic: string;
  versionHistory: ContentVersionEntry[];
  sourceOpportunityReportId: string | null;
  sourceReviewReportId: string | null;
  supportingEvidence: string[];
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ806: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverFabricateSeoPerformanceClaims: true;
  neverPublishArticles: true;
  neverManipulateSearchRankings: true;
  neverReplaceAnalyticsWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ806OrLater: true;
};

export type SeowInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  topic?: string | null;
  productCategory?: string | null;
  niche?: string | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  reviewReport?: ReviewFixture | null;
  fixtureReview?: ReviewFixture | null;
  fixtureKeywords?: KeywordSeed[] | null;
  fixtureClusterTopics?: string[] | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateSeoPerformanceClaims?: boolean;
  publishArticles?: boolean;
  manipulateSearchRankings?: boolean;
  replaceAnalyticsWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ806OrLater?: boolean;
  missionId?: string | null;
};

export type SeowRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: SeoContentReport | null;
  contentPlan?: SeoContentPlan | null;
  articleBrief?: ArticleBrief | null;
  seoArticle?: SeoArticle | null;
  targetKeywords?: KeywordMappingEntry[];
  internalLinkingPlan?: InternalLinkRecommendation[];
  contentQualitySummary?: ContentQualitySummary | null;
  versionHistory?: ContentVersionEntry[];
  notes: string[];
};

export type SeoContentWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalArticles: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type SeoContentWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalArticles: number;
};

export type SeoContentWorkerCockpitSnapshot = {
  missionId: "Q8-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalArticles: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateSeoPerformanceClaims: true;
  neverPublishArticles: true;
  neverManipulateSearchRankings: true;
  neverReplaceAnalyticsWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ806OrLater: true;
  consumableByQ806: true;
};

export type SeoContentWorkerState = {
  engineVersion: "PILLOW-SEOW-001";
  missionId: "Q8-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SeoContentWorkerConfiguration;
  latestReport: SeoContentReport | null;
  engineRecord: SeoContentWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalArticles: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q806ConsumableContract = {
  contractVersion: "SEOW-Q806-v1";
  consumableByQ806: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateSeoPerformanceClaims: true;
  neverPublishArticles: true;
  neverManipulateSearchRankings: true;
  neverReplaceAnalyticsWorker: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type SeoSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  topic: string;
  sourceOpportunityReportId: string | null;
  sourceReviewReportId: string | null;
  contentPlan: SeoContentPlan | null;
  targetKeywords: KeywordMappingEntry[];
  searchIntent: SearchIntent;
  articleBrief: ArticleBrief | null;
  seoArticle: SeoArticle | null;
  internalLinkingPlan: InternalLinkRecommendation[];
  contentQualitySummary: ContentQualitySummary | null;
  versionHistory: ContentVersionEntry[];
  outstandingIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof SEO_CONTENT_WORKER_IDENTITY;
