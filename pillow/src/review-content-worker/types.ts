import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RCW_METADATA_VERSION,
  REVIEW_CONTENT_WORKER_IDENTITY,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ReviewContentWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type ReviewProductFixture = {
  productId: string;
  name: string;
  category: string;
  programmeId?: string;
  price?: number | null;
  currency?: string | null;
  features?: string[];
  specs?: Record<string, string>;
  pros?: string[];
  cons?: string[];
  bestFor?: string | null;
  limitations?: string[];
  notes?: string;
  reviewType?: "product" | "service";
};

export type OpportunityFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  affiliateBusinessId?: string;
  programmeName?: string;
  productCategory?: string;
  targetNiche?: string;
  opportunityScore?: number | null;
  opportunityRanking?: Array<{
    rank: number;
    programmeId: string;
    programmeName: string;
    productCategory: string;
    targetNiche: string;
    opportunityScore: number | null;
    scoreBasis?: string[];
  }>;
  products?: Array<{ productId: string; name: string; category: string; programmeId?: string }>;
};

export type ComparisonFixture = {
  reportId?: string;
  affiliateProjectId?: string;
  comparisonTopic?: string;
  productsCompared?: Array<{
    productId: string;
    name: string;
    category?: string;
    programmeId?: string;
    price?: number | null;
    currency?: string | null;
    features?: string[];
    pros?: string[];
    cons?: string[];
    bestFor?: string | null;
  }>;
  rankingResults?: Array<{
    rank: number;
    productId: string;
    productName: string;
    score: number | null;
    bestFor?: string | null;
    rationale?: string[];
  }>;
  buyerGuide?: {
    bestForRecommendations?: Array<{
      label: string;
      productId: string;
      productName: string;
      reason: string;
    }>;
  };
};

export type ReviewedSubject = Omit<
  ReviewProductFixture,
  "price" | "currency" | "features" | "specs" | "pros" | "cons" | "bestFor" | "limitations"
> & {
  price: number | null;
  currency: string | null;
  features: string[];
  specs: Record<string, string>;
  pros: string[];
  cons: string[];
  bestFor: string | null;
  limitations: string[];
  source: "fixture" | "opportunity_report" | "comparison_site_report";
  fabricated: false;
  evidencePresent: boolean;
};

export type ProsConsSection = {
  sectionId: string;
  productId: string;
  productName: string;
  pros: string[];
  cons: string[];
  fabricated: false;
  derivedFromEvidence: true;
};

export type AlternativeRecommendation = {
  alternativeId: string;
  productId: string;
  productName: string;
  relativeToProductId: string;
  reason: string;
  tradeOff: string;
  fabricated: false;
  evidencePresent: boolean;
};

export type BuyingRecommendation = {
  recommendationId: string;
  productId: string;
  productName: string;
  verdict: "buy" | "buy_with_conditions" | "consider_alternatives" | "insufficient_evidence";
  summary: string;
  conditions: string[];
  fabricated: false;
  evidencePresent: boolean;
};

export type IdealCustomerProfile = {
  profileId: string;
  productId: string;
  productName: string;
  summary: string;
  traits: string[];
  fabricated: false;
  derivedFromEvidence: true;
};

export type LimitationsSection = {
  sectionId: string;
  productId: string;
  productName: string;
  limitations: string[];
  tradeOffs: string[];
  fabricated: false;
  derivedFromEvidence: true;
};

export type ReviewArticle = {
  articleId: string;
  reviewType: "product" | "service";
  title: string;
  productOrServiceReviewed: string;
  productId: string;
  summary: string;
  keyFeatures: string[];
  performanceSummary: string;
  verdictSection: string;
  faqs: Array<{ question: string; answer: string }>;
  sections: Array<{ heading: string; body: string }>;
  version: number;
  fabricated: false;
};

export type ReviewVersionEntry = {
  version: number;
  articleId: string;
  reportId: string | null;
  timestamp: string;
  changeSummary: string;
};

export type ReviewContentReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  productOrServiceReviewed: string;
  reviewSummary: string;
  pros: string[];
  cons: string[];
  alternatives: AlternativeRecommendation[];
  buyingRecommendation: BuyingRecommendation;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof RCW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  productId: string;
  reviewArticle: ReviewArticle;
  prosCons: ProsConsSection;
  idealCustomerProfile: IdealCustomerProfile;
  limitations: LimitationsSection;
  versionHistory: ReviewVersionEntry[];
  sourceOpportunityReportId: string | null;
  sourceComparisonReportId: string | null;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ805: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverFabricateReviewsRatingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRatings: true;
  neverReplaceComparisonSiteWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ805OrLater: true;
};

export type RcwInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  productId?: string | null;
  productOrServiceReviewed?: string | null;
  productCategory?: string | null;
  niche?: string | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  comparisonReport?: ComparisonFixture | null;
  fixtureComparison?: ComparisonFixture | null;
  fixtureProduct?: ReviewProductFixture | null;
  fixtureAlternatives?: ReviewProductFixture[] | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateReviewsRatingsOrProductInformation?: boolean;
  publishWebsites?: boolean;
  manipulateRatings?: boolean;
  replaceComparisonSiteWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ805OrLater?: boolean;
  missionId?: string | null;
};

export type RcwRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: ReviewContentReport | null;
  reviewArticle?: ReviewArticle | null;
  prosCons?: ProsConsSection | null;
  alternatives?: AlternativeRecommendation[];
  buyingRecommendation?: BuyingRecommendation | null;
  idealCustomerProfile?: IdealCustomerProfile | null;
  limitations?: LimitationsSection | null;
  versionHistory?: ReviewVersionEntry[];
  notes: string[];
};

export type ReviewContentWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalReviews: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type ReviewContentWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalReviews: number;
};

export type ReviewContentWorkerCockpitSnapshot = {
  missionId: "Q8-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalReviews: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateReviewsRatingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRatings: true;
  neverReplaceComparisonSiteWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ805OrLater: true;
  consumableByQ805: true;
};

export type ReviewContentWorkerState = {
  engineVersion: "PILLOW-RCW-001";
  missionId: "Q8-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: ReviewContentWorkerConfiguration;
  latestReport: ReviewContentReport | null;
  engineRecord: ReviewContentWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalReviews: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q805ConsumableContract = {
  contractVersion: "RCW-Q805-v1";
  consumableByQ805: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateReviewsRatingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRatings: true;
  neverReplaceComparisonSiteWorker: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type ReviewSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  productId: string;
  productOrServiceReviewed: string;
  sourceOpportunityReportId: string | null;
  sourceComparisonReportId: string | null;
  subject: ReviewedSubject | null;
  alternatives: AlternativeRecommendation[];
  reviewArticle: ReviewArticle | null;
  prosCons: ProsConsSection | null;
  buyingRecommendation: BuyingRecommendation | null;
  idealCustomerProfile: IdealCustomerProfile | null;
  limitations: LimitationsSection | null;
  versionHistory: ReviewVersionEntry[];
  outstandingIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof REVIEW_CONTENT_WORKER_IDENTITY;
