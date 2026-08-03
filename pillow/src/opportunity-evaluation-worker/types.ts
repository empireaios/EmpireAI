import type { OpportunityEvaluationWorkerConfiguration } from "./configuration.js";
import type {
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OEW_CAPABILITIES,
  OPERATIONAL_STATES,
  RECOMMENDATIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type Recommendation = (typeof RECOMMENDATIONS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type OpportunityEvaluationWorkerCapability = (typeof OEW_CAPABILITIES)[number];

export type ScoreBreakdown = {
  score: number;
  explanation: string;
  facts: string[];
  assumptions: string[];
  evidenceRefs: string[];
};

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Compact Business Model input from Q2-03. */
export type BusinessModelInput = {
  businessModelId?: string | null;
  businessType?: BusinessType | string | null;
  businessModelType?: string | null;
  valueProposition?: string | null;
  productsServices?: string[] | null;
  customerSegments?: string[] | null;
  revenueModel?: string | null;
  costModel?: string | null;
  operatingModel?: string | null;
  requiredCapabilities?: string[] | null;
  requiredIntegrations?: string[] | null;
  businessAssumptions?: string[] | null;
  sourceIntentId?: string | null;
  originalCommand?: string | null;
};

/** Compact Market Research Report input from Q2-04. */
export type MarketResearchInput = {
  reportId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  targetMarket?: string | null;
  customerProblems?: string[] | null;
  customerSegments?: string[] | null;
  marketDemand?: {
    demandLevel?: "low" | "moderate" | "high" | "unclear" | string | null;
    summary?: string | null;
    demandSignals?: string[] | null;
    facts?: string[] | null;
    assumptions?: string[] | null;
  } | null;
  marketSize?: {
    tamSummary?: string | null;
    samSummary?: string | null;
    somSummary?: string | null;
    sizingBasis?: string | null;
    facts?: string[] | null;
    assumptions?: string[] | null;
  } | null;
  competitorAnalysis?: Array<{
    name?: string | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
  }> | null;
  industryTrends?: string[] | null;
  opportunitySize?: {
    opportunityLevel?: "low" | "moderate" | "high" | "unclear" | string | null;
    summary?: string | null;
    estimatedRelativeOpportunity?: string | null;
    facts?: string[] | null;
    assumptions?: string[] | null;
  } | null;
  barriersToEntry?: string[] | null;
  risks?: Array<{
    category?: string | null;
    description?: string | null;
    severity?: "low" | "moderate" | "high" | string | null;
  }> | null;
  confidenceScore?: number | null;
  supportingEvidence?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  missingInformation?: string[] | null;
  facts?: string[] | null;
  assumptions?: string[] | null;
};

/** Machine-readable Opportunity Evaluation Report (Q2-05). */
export type OpportunityEvaluationReport = {
  evaluationId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessType: BusinessType | string;
  demandScore: number;
  feasibilityScore: number;
  profitPotentialScore: number;
  riskScore: number;
  strategicFitScore: number;
  overallOpportunityScore: number;
  recommendation: Recommendation;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  /** Explained score dimensions (mandatory: explain every score). */
  scoreExplanations: {
    demand: ScoreBreakdown;
    feasibility: ScoreBreakdown;
    revenuePotential: ScoreBreakdown;
    profitPotential: ScoreBreakdown;
    operationalComplexity: ScoreBreakdown;
    executionRisk: ScoreBreakdown;
    strategicFit: ScoreBreakdown;
    overall: ScoreBreakdown;
  };
  facts: string[];
  assumptions: string[];
  missingInformation: string[];
  sourceBusinessModelId: string | null;
  sourceMarketResearchReportId: string | null;
  sourceIntentId: string | null;
  originalCommand: string | null;
  scoreWeights: {
    demand: number;
    feasibility: number;
    profitPotential: number;
    risk: number;
    strategicFit: number;
  };
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverApproveBusiness: true;
  neverModifyBusinessModel: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  evidenceBasedScoring: true;
  preserveAuditHistory: true;
  preserveCompleteTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OpportunityEvaluationWorkerInput = {
  evaluationId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessModel?: BusinessModelInput | null;
  marketResearch?: MarketResearchInput | null;
  businessModelId?: string | null;
  marketResearchReportId?: string | null;
  originalCommand?: string | null;
  sourceIntentId?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  approveBusiness?: boolean;
  modifyBusinessModel?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ206OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type OpportunityEvaluationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityEvaluationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-OEW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OpportunityEvaluationWorkerCapability[];
  totalEvaluations: number;
  lastBusinessType: BusinessType | string | null;
  lastEvaluationId: string | null;
  lastOverallScore: number | null;
  lastRecommendation: Recommendation | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type OpportunityEvaluationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  evaluations: OpportunityEvaluationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverApproveBusiness: true;
  neverModifyBusinessModel: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type OpportunityEvaluationWorkerRunReport = {
  evaluationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_business_model"
    | "receive_market_research"
    | "evaluate_demand"
    | "evaluate_feasibility"
    | "evaluate_profit"
    | "evaluate_risk"
    | "evaluate_strategic_fit"
    | "produce_evaluation"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: OpportunityEvaluationWorkerEngineRecord;
  catalog: OpportunityEvaluationWorkerCatalog | null;
  evaluations: OpportunityEvaluationReport[];
  latestEvaluation: OpportunityEvaluationReport | null;
  integrations: IntegrationHandshake[];
  validation: OpportunityEvaluationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityEvaluationWorkerState = {
  engineVersion: "PILLOW-OEW-001";
  missionId: "Q2-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: OpportunityEvaluationWorkerConfiguration;
  latestReport: OpportunityEvaluationWorkerRunReport | null;
  engineRecord: OpportunityEvaluationWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEvaluations: number;
    lastEvaluationId: string | null;
    lastOverallScore: number | null;
    lastRecommendation: Recommendation | null;
    notes: string[];
  };
};

export type OpportunityEvaluationWorkerCockpitSnapshot = {
  missionId: "Q2-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEvaluations: number;
  latestEvaluationId: string | null;
  lastOverallScore: number | null;
  lastRecommendation: Recommendation | null;
  workerId: string;
  neverApproveBusiness: true;
  neverModifyBusinessModel: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
