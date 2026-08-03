import type {
  AFFILIATE_OPPORTUNITY_WORKER_IDENTITY,
  AOW_METADATA_VERSION,
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_MODES,
  OPERATIONAL_STATES,
  RECOMMENDATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AffiliateOpportunityWorkerConfiguration } from "./configuration.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export type ProgrammeFixture = {
  programmeId: string;
  programmeName: string;
  network?: string;
  cookieDays?: number;
  payoutFrequency?: string;
  notes?: string;
};

export type ProductFixture = {
  productId: string;
  name: string;
  category: string;
  programmeId: string;
  notes?: string;
};

export type NicheFixture = {
  nicheId: string;
  name: string;
  region?: string;
  notes?: string;
};

export type CommissionFixture = {
  programmeId: string;
  commissionPercent: number;
  cookieDays?: number;
  payoutFrequency?: string;
  notes?: string;
};

export type DemandSignalFixture = {
  nicheId: string;
  searchVolumeBand?: string;
  trend?: string;
  seasonality?: string;
  notes?: string;
};

export type CompetitionFixture = {
  nicheId: string;
  competitorCountBand?: string;
  notes?: string;
};

export type DiscoveredProgramme = ProgrammeFixture & {
  source: "fixture" | "injected";
  fabricated: false;
};

export type DiscoveredProduct = ProductFixture & {
  source: "fixture" | "injected";
  fabricated: false;
};

export type ResearchedNiche = NicheFixture & {
  source: "fixture" | "injected";
  fabricated: false;
};

export type CommissionStructure = {
  programmeId: string;
  programmeName: string;
  commissionPercent: number | null;
  cookieDays: number | null;
  payoutFrequency: string | null;
  comparisonNotes: string[];
  fabricated: false;
  evidencePresent: boolean;
};

export type DemandAssessment = {
  nicheId: string;
  searchVolumeBand: string;
  trend: string;
  seasonality: string;
  estimatedDemand: string;
  fabricated: false;
  evidencePresent: boolean;
  notes: string[];
};

export type CompetitionSummary = {
  nicheId: string;
  competitorCountBand: string;
  summary: string;
  fabricated: false;
  evidencePresent: boolean;
  notes: string[];
};

export type RankedOpportunity = {
  rank: number;
  opportunityKey: string;
  programmeId: string;
  programmeName: string;
  productCategory: string;
  targetNiche: string;
  opportunityScore: number | null;
  scoreBasis: string[];
  recommendation: RecommendationStatus;
  fabricated: false;
};

export type OpportunityRisk = {
  riskId: string;
  severity: "low" | "medium" | "high";
  description: string;
  relatedProgrammeId?: string | null;
  relatedNicheId?: string | null;
};

export type AffiliateOpportunityReport = {
  reportId: string;
  timestamp: string;
  affiliateProjectId: string;
  programmeName: string;
  productCategory: string;
  targetNiche: string;
  commissionStructure: CommissionStructure;
  estimatedDemand: string;
  competitionSummary: string;
  opportunityScore: number | null;
  risks: OpportunityRisk[];
  recommendation: RecommendationStatus;
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadataVersion: typeof AOW_METADATA_VERSION | string;
  reportVersion: string;
  workerId: string;
  affiliateBusinessId: string;
  programmes: DiscoveredProgramme[];
  products: DiscoveredProduct[];
  niches: ResearchedNiche[];
  commissionComparisons: CommissionStructure[];
  demandAssessment: DemandAssessment;
  competitionAssessment: CompetitionSummary;
  seasonalNotes: string[];
  opportunityRanking: RankedOpportunity[];
  evidenceSources: string[];
  evidenceMode: EvidenceMode;
  validation: {
    decision: "pass" | "partial" | "fail";
    errors: string[];
    warnings: string[];
  };
  runTimestamp: string;
  consumableByQ803: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveResearchEvidence: true;
  preserveAuditHistory: true;
  neverFabricateCommissionOrDemandData: true;
  neverCreateAffiliateContent: true;
  neverPublishWebsites: true;
  neverJoinAffiliateProgrammesAutomatically: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ803OrLater: true;
};

export type AowInput = {
  affiliateProjectId?: string | null;
  affiliateBusinessId?: string | null;
  factoryProjectId?: string | null;
  niche?: string | null;
  region?: string | null;
  productCategory?: string | null;
  programmeName?: string | null;
  evidenceMode?: EvidenceMode | null;
  fixtureProgrammes?: ProgrammeFixture[] | null;
  fixtureProducts?: ProductFixture[] | null;
  fixtureNiches?: NicheFixture[] | null;
  fixtureCommissionData?: CommissionFixture[] | null;
  fixtureDemandSignals?: DemandSignalFixture[] | null;
  fixtureCompetition?: CompetitionFixture[] | null;
  grandKingInstructions?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateCommissionOrDemandData?: boolean;
  createAffiliateContent?: boolean;
  publishWebsites?: boolean;
  joinAffiliateProgrammesAutomatically?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ803OrLater?: boolean;
  missionId?: string | null;
};

export type AowRunReport = {
  action: string;
  validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] };
  latestReport: AffiliateOpportunityReport | null;
  programmes?: DiscoveredProgramme[];
  products?: DiscoveredProduct[];
  niches?: ResearchedNiche[];
  commissionComparisons?: CommissionStructure[];
  demandAssessment?: DemandAssessment | null;
  competitionAssessment?: CompetitionSummary | null;
  opportunityRanking?: RankedOpportunity[];
  risks?: OpportunityRisk[];
  recommendation?: RecommendationStatus | null;
  notes: string[];
};

export type AffiliateOpportunityWorkerEngineRecord = {
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalOpportunities: number;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  lastOpportunityScore: number | null;
};

export type AffiliateOpportunityWorkerCatalog = {
  workerId: string;
  workerName: string;
  capabilities: string[];
  evidenceModes: EvidenceMode[];
  totalReports: number;
  totalOpportunities: number;
};

export type AffiliateOpportunityWorkerCockpitSnapshot = {
  missionId: "Q8-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalOpportunities: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateCommissionOrDemandData: true;
  neverCreateAffiliateContent: true;
  neverPublishWebsites: true;
  neverJoinAffiliateProgrammesAutomatically: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ803OrLater: true;
  consumableByQ803: true;
};

export type AffiliateOpportunityWorkerState = {
  engineVersion: "PILLOW-AOW-001";
  missionId: "Q8-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: AffiliateOpportunityWorkerConfiguration;
  latestReport: AffiliateOpportunityReport | null;
  engineRecord: AffiliateOpportunityWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalOpportunities: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type Q803ConsumableContract = {
  contractVersion: "AOW-Q803-v1";
  consumableByQ803: true;
  fields: readonly string[];
  types: Record<string, string>;
  notes: string[];
  neverFabricateCommissionOrDemandData: true;
  neverCreateAffiliateContent: true;
  neverPublishWebsites: true;
  neverJoinAffiliateProgrammesAutomatically: true;
};

export type IntegrationHandshake = {
  target: string;
  status: "bound" | "unavailable" | "failed";
  timestamp: string;
  detail: string;
};

export type IntegrationTarget = string;

export type OpportunitySession = {
  sessionId: string;
  affiliateBusinessId: string;
  affiliateProjectId: string;
  evidenceMode: EvidenceMode;
  programmes: DiscoveredProgramme[];
  products: DiscoveredProduct[];
  niches: ResearchedNiche[];
  commissionComparisons: CommissionStructure[];
  demandAssessment: DemandAssessment | null;
  competitionAssessment: CompetitionSummary | null;
  opportunityRanking: RankedOpportunity[];
  risks: OpportunityRisk[];
  recommendation: RecommendationStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkerIdentity = typeof AFFILIATE_OPPORTUNITY_WORKER_IDENTITY;
