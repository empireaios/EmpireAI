import type {
  AUDIT_STATUSES,
  COMPARISON_SITE_WORKER_IDENTITY,
  CSW_METADATA_VERSION,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ComparisonSiteWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type ProductComparisonFixture = {
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
  notes?: string;
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

export type ComparedProduct = Omit<
  ProductComparisonFixture,
  "price" | "currency" | "features" | "specs" | "pros" | "cons" | "bestFor"
> & {
  price: number | null;
  currency: string | null;
  features: string[];
  specs: Record<string, string>;
  pros: string[];
  cons: string[];
  bestFor: string | null;
  source: "fixture" | "opportunity_report";
  fabricated: false;
  evidencePresent: boolean;
};

export type ComparisonTable = {
  tableId: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, string>>;
  fabricated: false;
  derivedFromEvidence: true;
};

export type RankingResult = {
  rank: number;
  productId: string;
  productName: string;
  score: number | null;
  bestFor: string | null;
  rationale: string[];
  fabricated: false;
  evidencePresent: boolean;
};

export type ComparisonPage = {
  pageId: string;
  pageType: "comparison";
  title: string;
  topic: string;
  productsCompared: string[];
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  fabricated: false;
};

export type RankingPage = {
  pageId: string;
  pageType: "ranking";
  title: string;
  topic: string;
  topN: number;
  rankings: RankingResult[];
  methodologyRef: string;
  fabricated: false;
};

export type BuyerGuide = {
  guideId: string;
  title: string;
  topic: string;
  buyingFactors: string[];
  bestForRecommendations: Array<{ label: string; productId: string; productName: string; reason: string }>;
  faqs: Array<{ question: string; answer: string }>;
  prosConsByProduct: Array<{ productId: string; productName: string; pros: string[]; cons: string[] }>;
  fabricated: false;
};

export type MethodologySummary = {
  methodologyId: string;
  summary: string;
  factors: string[];
  evidenceRules: string[];
  neverFabricatedRankings: true;
};

export type ComparisonSiteReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  comparisonTopic: string;
  productsCompared: ComparedProduct[];
  rankingResults: RankingResult[];
  comparisonTables: ComparisonTable[];
  buyerGuide: BuyerGuide;
  methodologySummary: MethodologySummary;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof CSW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  sourceOpportunityReportId: string | null;
  comparisonPage: ComparisonPage;
  rankingPage: RankingPage;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  runTimestamp: string;
  consumableByQ804: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverFabricateRankingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRankingsWithoutEvidence: true;
  neverReplaceReviewContentWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ804OrLater: true;
};

export type CswInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  comparisonTopic?: string | null;
  productCategory?: string | null;
  niche?: string | null;
  opportunityReport?: OpportunityFixture | null;
  fixtureOpportunity?: OpportunityFixture | null;
  fixtureProducts?: ProductComparisonFixture[] | null;
  topN?: number | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateRankingsOrProductInformation?: boolean;
  publishWebsites?: boolean;
  manipulateRankingsWithoutEvidence?: boolean;
  replaceReviewContentWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ804OrLater?: boolean;
  missionId?: string | null;
};

export type CswRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: ComparisonSiteReport | null;
  comparisonPage?: ComparisonPage | null;
  rankingPage?: RankingPage | null;
  buyerGuide?: BuyerGuide | null;
  comparisonTables?: ComparisonTable[];
  rankingResults?: RankingResult[];
  methodologySummary?: MethodologySummary | null;
  notes: string[];
};

export type ComparisonSiteWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalPages: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
};

export type ComparisonSiteWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  totalReports: number;
  totalPages: number;
};

export type ComparisonSiteWorkerCockpitSnapshot = {
  missionId: "Q8-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalPages: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateRankingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRankingsWithoutEvidence: true;
  neverReplaceReviewContentWorker: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ804OrLater: true;
  consumableByQ804: true;
};

export type ComparisonSiteWorkerState = {
  engineVersion: "PILLOW-CSW-001";
  missionId: "Q8-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: ComparisonSiteWorkerConfiguration;
  latestReport: ComparisonSiteReport | null;
  engineRecord: ComparisonSiteWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalPages: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q804ConsumableContract = {
  contractVersion: "CSW-Q804-v1";
  consumableByQ804: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateRankingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRankingsWithoutEvidence: true;
  neverReplaceReviewContentWorker: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type ComparisonSession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  comparisonTopic: string;
  sourceOpportunityReportId: string | null;
  products: ComparedProduct[];
  comparisonPage: ComparisonPage | null;
  rankingPage: RankingPage | null;
  buyerGuide: BuyerGuide | null;
  comparisonTables: ComparisonTable[];
  rankingResults: RankingResult[];
  methodologySummary: MethodologySummary | null;
  outstandingIssues: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof COMPARISON_SITE_WORKER_IDENTITY;
