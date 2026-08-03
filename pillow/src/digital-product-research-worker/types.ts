import type { DigitalProductResearchWorkerConfiguration } from "./configuration.js";
import type {
  DEMAND_LEVELS,
  DISCOVERY_SOURCES,
  DPR_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRIORITY_LEVELS,
  PRODUCT_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type DemandLevel = (typeof DEMAND_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DigitalProductResearchWorkerCapability = (typeof DPR_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic?: string;
  recordedAt: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

/** Machine-readable Digital Product Research Report (Q5-02). */
export type DigitalProductResearchReport = {
  researchReportId: string;
  timestamp: string;
  opportunityId: string;
  productCategory: ProductCategory;
  productType: ProductCategory;
  targetAudience: string;
  customerPainPoints: string[];
  marketGap: string;
  demandAssessment: string;
  demandLevel: DemandLevel;
  demandScore: number;
  competitorSummary: string;
  revenuePotential: string;
  revenuePotentialScore: number;
  opportunityScore: number;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  metadataVersion: string;
  businessId: string;
  factoryMissionId: string;
  researchTopic: string;
  discoverySource: DiscoverySource;
  recommendedPriority: PriorityLevel;
  evidenceKinds: EvidenceKind[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  ranking: number | null;
  neverCreateDigitalProducts: true;
  neverCreateSalesPages: true;
  neverProcessPayments: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedMarketEvidence: true;
  neverImplementQ503OrLater: true;
  useApprovedResearchSourcesOnly: true;
  distinguishFactsFromAssumptions: true;
  preserveCompleteSourceTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type DigitalProductResearchWorkerInput = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productCategory?: ProductCategory | string | null;
  productType?: ProductCategory | string | null;
  targetAudience?: string | null;
  researchTopic?: string | null;
  discoverySource?: DiscoverySource | string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  demandLevel?: DemandLevel | string | null;
  demandScore?: number | null;
  competitorSummary?: string | null;
  competitorNotes?: string | null;
  revenuePotential?: string | null;
  revenuePotentialScore?: number | null;
  opportunityScore?: number | null;
  confidenceScore?: number | null;
  recommendedPriority?: PriorityLevel | string | null;
  emergingTrendNotes?: string | null;
  nicheNotes?: string | null;
  searchDemandNotes?: string | null;
  supportingEvidence?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  createDigitalProducts?: boolean;
  createSalesPages?: boolean;
  processPayments?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  inventUnsupportedMarketEvidence?: boolean;
  implementQ503OrLater?: boolean;
  useUnapprovedSource?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type DigitalProductResearchWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductResearchWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DPR-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DigitalProductResearchWorkerCapability[];
  totalResearchReports: number;
  lastResearchReportId: string | null;
  lastOpportunityScore: number | null;
  lastConfidenceScore: number | null;
  lastRecommendedPriority: PriorityLevel | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type DigitalProductResearchWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  researchReports: DigitalProductResearchReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverCreateDigitalProducts: true;
  neverCreateSalesPages: true;
  neverProcessPayments: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type DigitalProductResearchWorkerRunReport = {
  researchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "analyse_customer_pain_points"
    | "analyse_search_demand"
    | "analyse_market_gaps"
    | "analyse_competitor_products"
    | "analyse_emerging_trends"
    | "discover_underserved_niches"
    | "estimate_demand"
    | "estimate_commercial_opportunity"
    | "rank_opportunities"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DigitalProductResearchWorkerEngineRecord;
  catalog: DigitalProductResearchWorkerCatalog | null;
  researchReports: DigitalProductResearchReport[];
  latestResearchReport: DigitalProductResearchReport | null;
  integrations: IntegrationHandshake[];
  validation: DigitalProductResearchWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductResearchWorkerState = {
  engineVersion: "PILLOW-DPR-001";
  missionId: "Q5-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: DigitalProductResearchWorkerConfiguration;
  latestReport: DigitalProductResearchWorkerRunReport | null;
  engineRecord: DigitalProductResearchWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalResearchReports: number;
    lastResearchReportId: string | null;
    lastOpportunityScore: number | null;
    lastConfidenceScore: number | null;
    lastRecommendedPriority: PriorityLevel | null;
    notes: string[];
  };
};

export type DigitalProductResearchWorkerCockpitSnapshot = {
  missionId: "Q5-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalResearchReports: number;
  latestResearchReportId: string | null;
  lastOpportunityScore: number | null;
  lastConfidenceScore: number | null;
  lastRecommendedPriority: PriorityLevel | null;
  workerId: string;
  neverCreateDigitalProducts: true;
  neverCreateSalesPages: true;
  neverProcessPayments: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
