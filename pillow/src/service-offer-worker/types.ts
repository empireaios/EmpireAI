import type {
  LocalMarketResearchReport,
  PricingFindings,
  Q703ConsumableContract,
} from "../local-market-research-worker/types.js";
import type { ServiceOfferWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_CLASSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PACKAGE_TYPES,
  SOW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PackageType = (typeof PACKAGE_TYPES)[number];
export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ServiceOfferWorkerCapability = (typeof SOW_CAPABILITIES)[number];

export type { LocalMarketResearchReport, PricingFindings, Q703ConsumableContract };

export type EvidencedOrAssumed<T = string> = {
  value: T;
  evidenceClass: EvidenceClass;
  explanation?: string;
  source?: "research" | "assumption" | "fixture" | "unknown";
};

export type ServiceCatalogueItem = {
  serviceId: string;
  name: string;
  description: string;
  category: string;
  targetSegments: string[];
  geographicCoverage: string;
  evidenceClass: EvidenceClass;
  sourceResearchRefs: string[];
};

export type ServicePackage = {
  packageId: string;
  name: string;
  targetCustomer: string;
  pricingModel: string;
  recommendedPrice: EvidencedOrAssumed;
  pricingAssumptions: string[];
  estimatedDuration: string;
  estimatedOperationalCost: EvidencedOrAssumed;
  estimatedGrossMargin: EvidencedOrAssumed;
  optionalExtras: string[];
  renewalOptions: string[];
  packageType: PackageType;
  inclusions: string[];
  exclusions: string[];
  geographicCoverage: string;
  sourceResearchRefs: string[];
};

export type PricingRecommendation = {
  recommendationId: string;
  packageId: string;
  recommendedPrice: EvidencedOrAssumed;
  currency: string;
  pricingModel: string;
  researchTypicalRange: string | null;
  researchMinObserved: string | null;
  researchMaxObserved: string | null;
  pricingAssumptions: string[];
  evidenceClass: EvidenceClass;
  referencesQ702PricingFindings: true;
  sourceResearchId: string;
};

export type Guarantee = {
  guaranteeId: string;
  packageId: string;
  satisfaction?: string;
  workmanship?: string;
  responseTime?: string;
  arrivalWindow?: string;
  warrantyPeriod?: string;
  refundConditions?: string;
  reworkConditions?: string;
  evidenceClass: EvidenceClass;
  supported: boolean;
};

export type FulfilmentRequirement = {
  fulfilmentId: string;
  packageId: string;
  skills: string[];
  equipment: string[];
  materials: string[];
  licences: string[];
  estimatedManpower: string;
  workflowPrerequisites: string[];
  customerPreparation: string[];
  completionCriteria: string[];
  evidenceClass: EvidenceClass;
};

export type ServiceOfferReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  serviceCatalogue: ServiceCatalogueItem[];
  servicePackages: ServicePackage[];
  pricingRecommendations: PricingRecommendation[];
  packageInclusions: Array<{ packageId: string; inclusions: string[] }>;
  packageExclusions: Array<{ packageId: string; exclusions: string[] }>;
  guarantees: Guarantee[];
  fulfilmentRequirements: FulfilmentRequirement[];
  operationalAssumptions: string[];
  risks: string[];
  outstandingQuestions: string[];
  confidenceScore: number;
  executiveSummary: string;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  sourceResearchId: string;
  evidenceAssumptionNotes: string[];
  consumableByQ704: true;
  neverBuildBookingSystems: true;
  neverBuildCrm: true;
  neverExecuteCustomerJobs: true;
  neverLaunchBusiness: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricatePricingEvidence: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ704OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

/** Deterministic fixture mirroring LMRW report shape for tests / offline offer building. */
export type ResearchFixture = {
  researchId?: string;
  businessProjectId?: string;
  targetCountry?: string;
  targetCity?: string;
  targetServiceArea?: string;
  serviceCategory?: string;
  customerSegments?: string[];
  demand?: {
    demandIndicators?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    searchPatterns?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    frequencySignals?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    urgencySignals?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    repeatPotential?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    emergencyPotential?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
  } | null;
  competitors?: Array<{
    name: string;
    serviceArea?: string;
    services?: string[];
    pricingModel?: string;
    positioning?: string;
    evidenceClass?: EvidenceClass;
  }> | null;
  pricingFindings?: {
    currency?: string;
    typicalPriceRange?: { value: string; evidenceClass?: EvidenceClass };
    minObservedPrice?: { value: string; evidenceClass?: EvidenceClass };
    maxObservedPrice?: { value: string; evidenceClass?: EvidenceClass };
    hourlyRates?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    fixedPackages?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    emergencySurcharges?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    recurringPricing?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
    refundGuaranteePractices?: Array<{ value: string; evidenceClass?: EvidenceClass }>;
  } | null;
  painPoints?: Array<{ description: string; affectedSegment?: string }> | null;
  gaps?: Array<{ description: string; unmetNeed?: string }> | null;
  opportunities?: Array<{
    description: string;
    targetCustomer?: string;
    pricingIndication?: string;
  }> | null;
  risks?: string[] | null;
  assumptions?: string[] | null;
  unknowns?: string[] | null;
};

export type ServiceOfferInput = {
  reportId?: string | null;
  offerId?: string | null;
  businessProjectId?: string | null;
  researchId?: string | null;
  marketResearchReport?: LocalMarketResearchReport | null;
  fixtureMarketResearch?: ResearchFixture | null;
  serviceCategory?: string | null;
  targetCountry?: string | null;
  targetCity?: string | null;
  targetServiceArea?: string | null;
  customerSegments?: string[] | null;
  packageTypes?: PackageType[] | string[] | null;
  currency?: string | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildBookingSystems?: boolean;
  buildCrm?: boolean;
  executeCustomerJobs?: boolean;
  launchBusiness?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricatePricingEvidence?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ704OrLater?: boolean;
};

export type OfferSession = {
  offerId: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "building" | "reported" | "submitted" | "rejected";
  input: ServiceOfferInput;
  sourceResearchId: string | null;
  marketResearch: LocalMarketResearchReport | ResearchFixture | null;
  researchSource: "marketResearchReport" | "researchId" | "fixtureMarketResearch" | "none";
  serviceCatalogue: ServiceCatalogueItem[];
  servicePackages: ServicePackage[];
  pricingRecommendations: PricingRecommendation[];
  packageInclusions: Array<{ packageId: string; inclusions: string[] }>;
  packageExclusions: Array<{ packageId: string; exclusions: string[] }>;
  guarantees: Guarantee[];
  fulfilmentRequirements: FulfilmentRequirement[];
  operationalAssumptions: string[];
  risks: string[];
  outstandingQuestions: string[];
  pricingEvidenceAvailable: boolean;
};

export type OfferContext = {
  offerId: string;
  businessProjectId: string;
  sourceResearchId: string;
  serviceCategory: string;
  targetCountry: string;
  targetCity: string;
  targetServiceArea: string;
  customerSegments: string[];
  currency: string;
  packageTypes: PackageType[];
  marketResearch: LocalMarketResearchReport | ResearchFixture | null;
  pricingFindings: PricingFindings | ResearchFixture["pricingFindings"] | null;
  pricingEvidenceAvailable: boolean;
  now: string;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ServiceOfferWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ServiceOfferWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SOW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ServiceOfferWorkerCapability[];
  totalReports: number;
  totalSessions: number;
  lastServiceCategory: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ServiceOfferWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: ServiceOfferReport[];
  sessions: OfferSession[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildBookingSystems: true;
  neverBuildCrm: true;
  neverExecuteCustomerJobs: true;
  neverLaunchBusiness: true;
  neverFabricatePricingEvidence: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ704OrLater: true;
  consumableByQ704: true;
};

export type ServiceOfferWorkerRunReport = {
  offerRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consume_market_research"
    | "define_service_catalogue"
    | "define_service_packages"
    | "recommend_pricing_structure"
    | "define_package_inclusions"
    | "define_package_exclusions"
    | "define_guarantees"
    | "define_fulfilment_requirements"
    | "define_required_resources"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ServiceOfferWorkerEngineRecord;
  catalog: ServiceOfferWorkerCatalog | null;
  reports: ServiceOfferReport[];
  sessions: OfferSession[];
  latestReport: ServiceOfferReport | null;
  latestSession: OfferSession | null;
  integrations: IntegrationHandshake[];
  validation: ServiceOfferWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ServiceOfferWorkerState = {
  engineVersion: "PILLOW-SOW-001";
  missionId: "Q7-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: ServiceOfferWorkerConfiguration;
  latestReport: ServiceOfferWorkerRunReport | null;
  engineRecord: ServiceOfferWorkerEngineRecord | null;
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

export type ServiceOfferWorkerCockpitSnapshot = {
  missionId: "Q7-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalSessions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverBuildBookingSystems: true;
  neverBuildCrm: true;
  neverExecuteCustomerJobs: true;
  neverLaunchBusiness: true;
  neverFabricatePricingEvidence: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ704OrLater: true;
  consumableByQ704: true;
};

/** Stable subset contract for Q7-04 Booking Worker. */
export type Q704ConsumableContract = {
  contractVersion: "SOW-Q704-v1";
  consumableByQ704: true;
  fields: readonly string[];
  types: {
    ServiceOfferReport: "ServiceOfferReport";
    ServiceCatalogueItem: "ServiceCatalogueItem";
    ServicePackage: "ServicePackage";
    PricingRecommendation: "PricingRecommendation";
    Guarantee: "Guarantee";
    FulfilmentRequirement: "FulfilmentRequirement";
  };
  notes: string[];
  neverBuildBookingSystems: true;
  neverBuildCrm: true;
  neverExecuteCustomerJobs: true;
  neverLaunchBusiness: true;
  neverFabricatePricingEvidence: true;
};
