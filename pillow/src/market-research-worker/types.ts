import type { MarketResearchWorkerConfiguration } from "./configuration.js";
import type {
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  MRW_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MarketResearchWorkerCapability = (typeof MRW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type CompetitorProfile = {
  competitorId: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  notes: string;
};

export type MarketDemandFinding = {
  demandLevel: "low" | "moderate" | "high" | "unclear";
  summary: string;
  demandSignals: string[];
  facts: string[];
  assumptions: string[];
};

export type MarketSizeFinding = {
  tamSummary: string;
  samSummary: string;
  somSummary: string;
  sizingBasis: string;
  facts: string[];
  assumptions: string[];
};

export type OpportunitySizeFinding = {
  opportunityLevel: "low" | "moderate" | "high" | "unclear";
  summary: string;
  estimatedRelativeOpportunity: string;
  facts: string[];
  assumptions: string[];
};

export type RiskFinding = {
  riskId: string;
  category: string;
  description: string;
  severity: "low" | "moderate" | "high";
  mitigationSignal: string;
};

/** Machine-readable Market Research Report (Q2-04). */
export type MarketResearchReport = {
  reportId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessType: BusinessType | string;
  targetMarket: string;
  customerProblems: string[];
  customerSegments: string[];
  marketDemand: MarketDemandFinding;
  marketSize: MarketSizeFinding;
  competitorAnalysis: CompetitorProfile[];
  industryTrends: string[];
  opportunitySize: OpportunitySizeFinding;
  barriersToEntry: string[];
  risks: RiskFinding[];
  confidenceScore: number;
  supportingEvidence: EvidenceItem[];
  recommendations: string[];
  missingInformation: string[];
  facts: string[];
  assumptions: string[];
  metadataVersion: string;
  reportVersion: string;
  sourceBusinessModelId: string | null;
  sourceIntentId: string | null;
  originalCommand: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverDecideWhetherToBuild: true;
  neverGenerateBranding: true;
  neverBuildMarketingPlans: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  evidenceBasedFindings: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type MarketResearchWorkerInput = {
  reportId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  targetMarket?: string | null;
  businessIdea?: string | null;
  originalCommand?: string | null;
  sourceBusinessModelId?: string | null;
  sourceIntentId?: string | null;
  customerProblems?: string[] | null;
  customerSegments?: string[] | null;
  knownCompetitors?: Array<{
    name?: string | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
    notes?: string | null;
  }> | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  marketSignals?: string[] | null;
  industryTrends?: string[] | null;
  barriersToEntry?: string[] | null;
  risks?: string[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  decideWhetherToBuild?: boolean;
  generateBranding?: boolean;
  buildMarketingPlan?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ205OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type MarketResearchWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MarketResearchWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MarketResearchWorkerCapability[];
  totalReports: number;
  lastBusinessType: BusinessType | string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MarketResearchWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: MarketResearchReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverDecideWhetherToBuild: true;
  neverGenerateBranding: true;
  neverBuildMarketingPlans: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type MarketResearchWorkerRunReport = {
  researchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "research_demand"
    | "analyse_competitors"
    | "analyse_customer_problems"
    | "estimate_opportunity"
    | "identify_risks"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MarketResearchWorkerEngineRecord;
  catalog: MarketResearchWorkerCatalog | null;
  reports: MarketResearchReport[];
  latestReport: MarketResearchReport | null;
  integrations: IntegrationHandshake[];
  validation: MarketResearchWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MarketResearchWorkerState = {
  engineVersion: "PILLOW-MRW-001";
  missionId: "Q2-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketResearchWorkerConfiguration;
  latestReport: MarketResearchWorkerRunReport | null;
  engineRecord: MarketResearchWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type MarketResearchWorkerCockpitSnapshot = {
  missionId: "Q2-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverDecideWhetherToBuild: true;
  neverGenerateBranding: true;
  neverBuildMarketingPlans: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
