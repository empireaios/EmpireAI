import type { ServiceOfferReport } from "../service-offer-worker/types.js";
import type { LocalSeoWorkerConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LSEO_CAPABILITIES,
  OPERATIONAL_STATES,
  PAGE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PageType = (typeof PAGE_TYPES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LocalSeoWorkerCapability = (typeof LSEO_CAPABILITIES)[number];

export type { ServiceOfferReport };

/** Deterministic fixture mirroring Service Offer Report shape for tests / offline SEO building. */
export type ServiceOfferFixture = {
  reportId?: string;
  businessProjectId?: string;
  businessName?: string;
  serviceCategory?: string;
  targetLocation?: string;
  targetCountry?: string;
  targetCity?: string;
  targetServiceArea?: string;
  serviceCatalogue?: Array<{
    serviceId?: string;
    name: string;
    description?: string;
    category?: string;
  }>;
  servicePackages?: Array<{
    packageId?: string;
    name: string;
    packageType?: string;
    targetCustomer?: string;
    inclusions?: string[];
    geographicCoverage?: string;
    recommendedPrice?: { value?: string };
  }>;
  napHints?: {
    name?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
  customerFacingLanguage?: string[];
};

export type LandingPageAsset = {
  pageId: string;
  pageType: PageType;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyOutline: string[];
  urlRecommendation: string;
  imageAltText: string[];
  faq: Array<{ question: string; answer: string }>;
  serviceName?: string;
  locationLabel?: string;
  sourceOfferRefs: string[];
};

export type GoogleBusinessRecommendation = {
  recommendationId: string;
  category: string;
  primaryCategorySuggestion: string;
  secondaryCategorySuggestions: string[];
  businessDescription: string;
  serviceItems: string[];
  photoSuggestions: string[];
  postIdeas: string[];
  hoursSuggestion: string;
  napChecklist: string[];
  neverModifyLiveGbpAutomatically: true;
  sourceOfferRefs: string[];
};

export type LocalKeyword = {
  keywordId: string;
  phrase: string;
  intent: "informational" | "transactional" | "navigational" | "local";
  locationModifier: string;
  serviceModifier: string;
  priority: "high" | "medium" | "low";
  sourceOfferRefs: string[];
};

export type SeoMetadata = {
  metadataId: string;
  pageId: string;
  titleTag: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrlRecommendation: string;
  sourceOfferRefs: string[];
};

export type StructuredDataRecommendation = {
  schemaId: string;
  schemaType: "LocalBusiness" | "Service" | "FAQPage" | "BreadcrumbList";
  jsonLdOutline: Record<string, unknown>;
  notes: string[];
  sourceOfferRefs: string[];
};

export type CitationRecommendation = {
  citationId: string;
  directoryName: string;
  napFields: string[];
  submissionNotes: string;
  neverPurchaseBacklinks: true;
  sourceOfferRefs: string[];
};

export type InternalLinkRecommendation = {
  linkId: string;
  fromPageId: string;
  toPageId: string;
  anchorText: string;
  rationale: string;
};

export type NapConsistencyRecommendation = {
  napId: string;
  recommendedName: string;
  recommendedAddress: string;
  recommendedPhone: string;
  recommendedWebsite: string;
  consistencyNotes: string[];
  sourceChannels: string[];
};

export type SeoCompletenessEvaluation = {
  evaluationId: string;
  checklist: Array<{
    item: string;
    present: boolean;
    weight: number;
    notes: string;
  }>;
  score: number;
  status: "complete" | "partial" | "incomplete";
  neverClaimsLiveRankingOrTraffic: true;
  outstandingGaps: string[];
};

export type LocalSeoReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  targetLocation: string;
  serviceCategory: string;
  landingPagesGenerated: LandingPageAsset[];
  googleBusinessRecommendations: GoogleBusinessRecommendation[];
  localKeywords: LocalKeyword[];
  metadata: SeoMetadata[];
  structuredDataRecommendations: StructuredDataRecommendation[];
  citationRecommendations: CitationRecommendation[];
  seoCompletenessStatus: SeoCompletenessEvaluation;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  internalLinkingRecommendations: InternalLinkRecommendation[];
  napConsistencyRecommendations: NapConsistencyRecommendation[];
  faqAssets: Array<{ question: string; answer: string; pageId: string }>;
  sourceOfferReportId: string;
  consumableByQ708: true;
  neverPublishWebsites: true;
  neverPurchaseBacklinks: true;
  neverManipulateSearchRankings: true;
  neverModifyLiveGoogleBusinessProfilesAutomatically: true;
  neverModifyUnrelatedPlatformComponents: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateSeoPerformanceResults: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ708OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

export type LocalSeoInput = {
  reportId?: string | null;
  seoId?: string | null;
  businessProjectId?: string | null;
  businessName?: string | null;
  serviceOfferReport?: ServiceOfferReport | null;
  fixtureServiceOffer?: ServiceOfferFixture | null;
  offerReportId?: string | null;
  serviceCategory?: string | null;
  targetLocation?: string | null;
  targetCountry?: string | null;
  targetCity?: string | null;
  targetServiceArea?: string | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  publishWebsites?: boolean;
  purchaseBacklinks?: boolean;
  manipulateSearchRankings?: boolean;
  modifyLiveGoogleBusinessProfilesAutomatically?: boolean;
  modifyUnrelatedPlatformComponents?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateSeoPerformanceResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ708OrLater?: boolean;
};

export type SeoSession = {
  seoId: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "building" | "reported" | "submitted" | "rejected";
  input: LocalSeoInput;
  sourceOfferReportId: string | null;
  serviceOffer: ServiceOfferReport | ServiceOfferFixture | null;
  offerSource: "serviceOfferReport" | "offerReportId" | "fixtureServiceOffer" | "none";
  businessName: string;
  targetLocation: string;
  serviceCategory: string;
  landingPages: LandingPageAsset[];
  googleBusinessRecommendations: GoogleBusinessRecommendation[];
  localKeywords: LocalKeyword[];
  metadata: SeoMetadata[];
  structuredDataRecommendations: StructuredDataRecommendation[];
  citationRecommendations: CitationRecommendation[];
  internalLinkingRecommendations: InternalLinkRecommendation[];
  napConsistencyRecommendations: NapConsistencyRecommendation[];
  faqAssets: Array<{ question: string; answer: string; pageId: string }>;
  completeness: SeoCompletenessEvaluation | null;
};

export type SeoContext = {
  seoId: string;
  businessProjectId: string;
  sourceOfferReportId: string;
  businessName: string;
  serviceCategory: string;
  targetCountry: string;
  targetCity: string;
  targetServiceArea: string;
  targetLocation: string;
  services: string[];
  packages: string[];
  napHints: NonNullable<ServiceOfferFixture["napHints"]>;
  customerFacingLanguage: string[];
  serviceOffer: ServiceOfferReport | ServiceOfferFixture | null;
  now: string;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LocalSeoWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocalSeoWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LSEO-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocalSeoWorkerCapability[];
  totalReports: number;
  totalSessions: number;
  lastServiceCategory: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LocalSeoWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: LocalSeoReport[];
  sessions: SeoSession[];
  landingPages: LandingPageAsset[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPublishWebsites: true;
  neverPurchaseBacklinks: true;
  neverManipulateSearchRankings: true;
  neverModifyLiveGoogleBusinessProfilesAutomatically: true;
  neverFabricateSeoPerformanceResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ708OrLater: true;
  consumableByQ708: true;
};

export type LocalSeoWorkerRunReport = {
  seoRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_service_offer"
    | "generate_google_business_recommendations"
    | "generate_landing_pages"
    | "generate_service_pages"
    | "generate_city_area_pages"
    | "generate_seo_titles_and_meta"
    | "generate_structured_data_recommendations"
    | "generate_local_keywords"
    | "generate_internal_linking_recommendations"
    | "generate_citation_recommendations"
    | "evaluate_seo_completeness"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LocalSeoWorkerEngineRecord;
  catalog: LocalSeoWorkerCatalog | null;
  reports: LocalSeoReport[];
  sessions: SeoSession[];
  latestReport: LocalSeoReport | null;
  latestSession: SeoSession | null;
  integrations: IntegrationHandshake[];
  validation: LocalSeoWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LocalSeoWorkerState = {
  engineVersion: "PILLOW-LSEO-001";
  missionId: "Q7-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalSeoWorkerConfiguration;
  latestReport: LocalSeoWorkerRunReport | null;
  engineRecord: LocalSeoWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalSessions: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type LocalSeoWorkerCockpitSnapshot = {
  missionId: "Q7-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalSessions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPublishWebsites: true;
  neverPurchaseBacklinks: true;
  neverManipulateSearchRankings: true;
  neverModifyLiveGoogleBusinessProfilesAutomatically: true;
  neverFabricateSeoPerformanceResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ708OrLater: true;
  consumableByQ708: true;
};

/** Stable subset contract for Q7-08 downstream consumers. */
export type Q708ConsumableContract = {
  contractVersion: "LSEO-Q708-v1";
  consumableByQ708: true;
  fields: readonly string[];
  types: {
    LocalSeoReport: "LocalSeoReport";
    LandingPageAsset: "LandingPageAsset";
    GoogleBusinessRecommendation: "GoogleBusinessRecommendation";
    LocalKeyword: "LocalKeyword";
    SeoMetadata: "SeoMetadata";
    StructuredDataRecommendation: "StructuredDataRecommendation";
    CitationRecommendation: "CitationRecommendation";
  };
  notes: string[];
  neverPublishWebsites: true;
  neverPurchaseBacklinks: true;
  neverManipulateSearchRankings: true;
  neverModifyLiveGoogleBusinessProfilesAutomatically: true;
  neverFabricateSeoPerformanceResults: true;
};
