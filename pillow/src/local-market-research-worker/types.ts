import type { LocalMarketResearchWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_CLASSES,
  EVIDENCE_MODES,
  INTEGRATION_TARGETS,
  LMRW_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];
export type EvidenceMode = (typeof EVIDENCE_MODES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LocalMarketResearchWorkerCapability = (typeof LMRW_CAPABILITIES)[number];

export type EvidencedValue<T = string> = {
  value: T;
  evidenceClass: EvidenceClass;
  explanation?: string;
};

export type DemandFindings = {
  demandIndicators: EvidencedValue[];
  searchPatterns: EvidencedValue[];
  frequencySignals: EvidencedValue[];
  urgencySignals: EvidencedValue[];
  seasonalPatterns: EvidencedValue[];
  residentialVsCommercial: EvidencedValue[];
  segmentDifferences: EvidencedValue[];
  geographicConcentration: EvidencedValue[];
  repeatPotential: EvidencedValue[];
  emergencyPotential: EvidencedValue[];
};

export type CompetitorProfile = {
  competitorId: string;
  name: string;
  serviceArea: string;
  services: string[];
  pricingModel: string;
  positioning: string;
  availability: string;
  bookingMethod: string;
  channels: string[];
  ratings: string;
  strengths: string[];
  weaknesses: string[];
  gaps: string[];
  evidenceSource: string;
  researchTimestamp: string;
  evidenceClass: EvidenceClass;
};

export type PricingFindings = {
  typicalPriceRange: EvidencedValue;
  minObservedPrice: EvidencedValue;
  maxObservedPrice: EvidencedValue;
  callOutFees: EvidencedValue[];
  hourlyRates: EvidencedValue[];
  fixedPackages: EvidencedValue[];
  emergencySurcharges: EvidencedValue[];
  materialFees: EvidencedValue[];
  transportFees: EvidencedValue[];
  inspectionFees: EvidencedValue[];
  recurringPricing: EvidencedValue[];
  promotions: EvidencedValue[];
  refundGuaranteePractices: EvidencedValue[];
  currency: string;
  taxInclusionStatus: EvidencedValue;
  /** Explicitly absent — LMRW never recommends final prices. */
  finalPriceRecommendation?: never;
};

export type PainPoint = {
  painPointId: string;
  description: string;
  affectedSegment: string;
  severity: "low" | "moderate" | "high" | "unknown";
  evidenceClass: EvidenceClass;
  supportingEvidence: string[];
};

export type ServiceGap = {
  gapId: string;
  description: string;
  geographicArea: string;
  unmetNeed: string;
  evidenceClass: EvidenceClass;
  supportingEvidence: string[];
};

export type ServiceOpportunity = {
  opportunityId: string;
  description: string;
  supportingEvidence: string[];
  targetCustomer: string;
  geographicArea: string;
  demandIndication: string;
  competitionLevel: string;
  pricingIndication: string;
  operationalConsiderations: string[];
  risks: string[];
  confidenceLevel: number;
  evidenceClass: EvidenceClass;
};

export type AttractivenessDimension = {
  score: number | null;
  evidenceClass: EvidenceClass;
  explanation: string;
  evidenceRefs: string[];
};

export type MarketAttractivenessAssessment = {
  demandStrength: AttractivenessDimension;
  competitionIntensity: AttractivenessDimension;
  pricingPotential: AttractivenessDimension;
  repeatPurchasePotential: AttractivenessDimension;
  customerUrgency: AttractivenessDimension;
  easeOfAcquisition: AttractivenessDimension;
  operationalComplexity: AttractivenessDimension;
  entryBarriers: AttractivenessDimension;
  regulatoryUncertainty: AttractivenessDimension;
  overallOpportunityConfidence: AttractivenessDimension;
};

export type EvidenceRecord = {
  evidenceId: string;
  sourceReference: string;
  sourceType: string;
  sourceDate: string | null;
  retrievalTimestamp: string;
  geographicRelevance: string;
  serviceRelevance: string;
  evidenceStrength: "weak" | "moderate" | "strong" | "unknown";
  confidenceLevel: number;
  inferenceMade: boolean;
  evidenceClass: EvidenceClass;
  evidenceMode: EvidenceMode;
  claim: string;
};

export type LocalMarketResearchReport = {
  researchId: string;
  timestamp: string;
  businessProjectId: string;
  targetCountry: string;
  targetCity: string;
  targetServiceArea: string;
  serviceCategory: string;
  customerSegments: string[];
  demandFindings: DemandFindings;
  competitorProfiles: CompetitorProfile[];
  pricingFindings: PricingFindings;
  customerPainPoints: PainPoint[];
  serviceGaps: ServiceGap[];
  opportunityFindings: ServiceOpportunity[];
  marketAttractivenessAssessment: MarketAttractivenessAssessment;
  risks: string[];
  assumptions: string[];
  unknowns: string[];
  evidenceSources: EvidenceRecord[];
  confidenceScore: number;
  recommendedResearchFollowUps: string[];
  executiveSummary: string;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  evidenceMode: EvidenceMode;
  consumableByQ703: true;
  neverFinalizeServicePackages: true;
  neverSetFinalPrices: true;
  neverMakeLaunchDecisions: true;
  neverBuildBookingSystems: true;
  neverBuildWebsites: true;
  neverContactCustomersOrCompetitorsWithoutApproval: true;
  neverPurchaseDataOrAdvertisingWithoutApproval: true;
  neverFabricateDemandPricingOrCompetitorData: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ703OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ResearchFixturePayload = {
  demand?: Partial<DemandFindings> | null;
  competitors?: CompetitorProfile[] | null;
  pricing?: Partial<PricingFindings> | null;
  painPoints?: PainPoint[] | null;
  gaps?: ServiceGap[] | null;
  opportunities?: ServiceOpportunity[] | null;
  attractiveness?: Partial<MarketAttractivenessAssessment> | null;
  evidence?: EvidenceRecord[] | null;
  customerSegments?: string[] | null;
  risks?: string[] | null;
  assumptions?: string[] | null;
  unknowns?: string[] | null;
  evidenceMode?: EvidenceMode | null;
};

export type LocalMarketResearchInput = {
  researchId?: string | null;
  businessProjectId?: string | null;
  targetCountry?: string | null;
  targetCity?: string | null;
  targetServiceArea?: string | null;
  serviceCategory?: string | null;
  customerSegment?: string | null;
  customerSegments?: string[] | null;
  searchRadius?: string | number | null;
  currency?: string | null;
  preferredResearchPeriod?: string | null;
  businessConstraints?: string[] | null;
  availableBudget?: string | number | null;
  existingResearchEvidence?: ResearchFixturePayload | EvidenceRecord[] | null;
  fixtureEvidence?: ResearchFixturePayload | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  finalizeServicePackages?: boolean;
  setFinalPrices?: boolean;
  makeLaunchDecisions?: boolean;
  buildBookingSystems?: boolean;
  buildWebsites?: boolean;
  contactCustomersOrCompetitorsWithoutApproval?: boolean;
  purchaseDataOrAdvertisingWithoutApproval?: boolean;
  fabricateDemandPricingOrCompetitorData?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ703OrLater?: boolean;
};

export type ResearchSession = {
  researchId: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "researching" | "reported" | "submitted" | "rejected";
  input: LocalMarketResearchInput;
  customerSegments: string[];
  demandFindings: DemandFindings | null;
  competitorProfiles: CompetitorProfile[];
  pricingFindings: PricingFindings | null;
  customerPainPoints: PainPoint[];
  serviceGaps: ServiceGap[];
  opportunityFindings: ServiceOpportunity[];
  marketAttractivenessAssessment: MarketAttractivenessAssessment | null;
  evidenceSources: EvidenceRecord[];
  risks: string[];
  assumptions: string[];
  unknowns: string[];
  evidenceMode: EvidenceMode;
  fixture: ResearchFixturePayload | null;
};

export type ResearchContext = {
  researchId: string;
  targetCountry: string;
  targetCity: string;
  targetServiceArea: string;
  serviceCategory: string;
  customerSegments: string[];
  searchRadius: string;
  currency: string;
  preferredResearchPeriod: string;
  businessConstraints: string[];
  availableBudget: string;
  businessProjectId: string;
  evidenceMode: EvidenceMode;
  fixture: ResearchFixturePayload | null;
  providedEvidence: EvidenceRecord[];
  now: string;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LocalMarketResearchWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocalMarketResearchWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LMRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocalMarketResearchWorkerCapability[];
  totalReports: number;
  totalSessions: number;
  lastServiceCategory: string | null;
  lastResearchId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LocalMarketResearchWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: LocalMarketResearchReport[];
  sessions: ResearchSession[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFinalizeServicePackages: true;
  neverSetFinalPrices: true;
  neverMakeLaunchDecisions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ703OrLater: true;
  consumableByQ703: true;
};

export type LocalMarketResearchWorkerRunReport = {
  researchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_research_request"
    | "research_local_demand"
    | "identify_customer_segments"
    | "research_competitors"
    | "profile_competitors"
    | "research_competitor_services"
    | "research_market_pricing"
    | "identify_pain_points"
    | "identify_service_gaps"
    | "analyze_service_opportunities"
    | "assess_market_attractiveness"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LocalMarketResearchWorkerEngineRecord;
  catalog: LocalMarketResearchWorkerCatalog | null;
  reports: LocalMarketResearchReport[];
  sessions: ResearchSession[];
  latestReport: LocalMarketResearchReport | null;
  latestSession: ResearchSession | null;
  integrations: IntegrationHandshake[];
  validation: LocalMarketResearchWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LocalMarketResearchWorkerState = {
  engineVersion: "PILLOW-LMRW-001";
  missionId: "Q7-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalMarketResearchWorkerConfiguration;
  latestReport: LocalMarketResearchWorkerRunReport | null;
  engineRecord: LocalMarketResearchWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalSessions: number;
    lastResearchId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type LocalMarketResearchWorkerCockpitSnapshot = {
  missionId: "Q7-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalSessions: number;
  latestResearchId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFinalizeServicePackages: true;
  neverSetFinalPrices: true;
  neverMakeLaunchDecisions: true;
  neverFabricateDemandPricingOrCompetitorData: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ703OrLater: true;
  consumableByQ703: true;
};

/** Stable subset contract for Q7-03 Service Offer Worker. */
export type Q703ConsumableContract = {
  contractVersion: "LMRW-Q703-v1";
  consumableByQ703: true;
  fields: readonly string[];
  types: {
    LocalMarketResearchReport: "LocalMarketResearchReport";
    DemandFindings: "DemandFindings";
    CompetitorProfile: "CompetitorProfile";
    PricingFindings: "PricingFindings";
    ServiceOpportunity: "ServiceOpportunity";
    MarketAttractivenessAssessment: "MarketAttractivenessAssessment";
    EvidenceRecord: "EvidenceRecord";
  };
  notes: string[];
  neverFinalizeServicePackages: true;
  neverSetFinalPrices: true;
  neverMakeLaunchDecisions: true;
};
