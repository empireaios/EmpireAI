import type { BusinessApprovalPackWorkerConfiguration } from "./configuration.js";
import type {
  APPROVAL_RECOMMENDATIONS,
  BAP_CAPABILITIES,
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type ApprovalRecommendation = (typeof APPROVAL_RECOMMENDATIONS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type BusinessApprovalPackWorkerCapability = (typeof BAP_CAPABILITIES)[number];

/** Compact Business Model input from Q2-03 (read-only). */
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
  metadataVersion?: string | null;
};

/** Compact Market Research input from Q2-04 (read-only). */
export type MarketResearchInput = {
  reportId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  targetMarket?: string | null;
  customerProblems?: string[] | null;
  customerSegments?: string[] | null;
  marketDemand?: { demandLevel?: string | null; summary?: string | null } | null;
  marketSize?: { estimate?: string | null; confidence?: string | null } | null;
  competitorAnalysis?: Array<{ name?: string | null; strengths?: string[] | null }> | null;
  industryTrends?: string[] | null;
  opportunitySize?: { level?: string | null; summary?: string | null } | null;
  barriersToEntry?: string[] | null;
  risks?: Array<{ description?: string | null; severity?: string | null }> | null;
  confidenceScore?: number | null;
  recommendations?: string[] | null;
  missingInformation?: string[] | null;
  facts?: string[] | null;
  assumptions?: string[] | null;
  sourceBusinessModelId?: string | null;
};

/** Compact Opportunity Evaluation input from Q2-05 (read-only). */
export type OpportunityEvaluationInput = {
  evaluationId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  demandScore?: number | null;
  feasibilityScore?: number | null;
  profitPotentialScore?: number | null;
  riskScore?: number | null;
  strategicFitScore?: number | null;
  overallOpportunityScore?: number | null;
  recommendation?: ApprovalRecommendation | string | null;
  confidenceScore?: number | null;
  facts?: string[] | null;
  assumptions?: string[] | null;
  missingInformation?: string[] | null;
  sourceBusinessModelId?: string | null;
  sourceMarketResearchReportId?: string | null;
};

/** Compact Business Blueprint input from Q2-06 (read-only). */
export type BusinessBlueprintInput = {
  blueprintId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessObjective?: string | null;
  productsServices?: string[] | null;
  customerSegments?: string[] | null;
  valueProposition?: string | null;
  requiredWorkers?: Array<{ workerRole?: string | null; priority?: string | null }> | null;
  requiredIntegrations?: string[] | null;
  requiredAssets?: string[] | null;
  dependencies?: Array<{ description?: string | null }> | null;
  businessArchitecture?: {
    revenueModel?: string | null;
    costModel?: string | null;
    operatingModel?: string | null;
    targetMarket?: string | null;
    deliveryChannels?: string[] | null;
  } | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
  approvedOpportunityRecommendation?: string | null;
  overallOpportunityScore?: number | null;
};

/** Compact Launch Plan input from Q2-07 (read-only). */
export type LaunchPlanInput = {
  launchPlanId?: string | null;
  businessBuildMissionId?: string | null;
  businessBlueprintId?: string | null;
  businessType?: BusinessType | string | null;
  launchObjective?: string | null;
  launchStages?: Array<{ stageKey?: string | null; name?: string | null }> | null;
  milestones?: Array<{ milestoneId?: string | null; name?: string | null }> | null;
  tasks?: Array<{ taskId?: string | null; name?: string | null }> | null;
  approvalCheckpoints?: Array<{ checkpointId?: string | null; name?: string | null }> | null;
  validationCheckpoints?: Array<{ checkpointId?: string | null; name?: string | null }> | null;
  blockers?: Array<{ description?: string | null; severity?: string | null }> | null;
  missingPrerequisites?: string[] | null;
  rollbackConditions?: Array<{ description?: string | null; action?: string | null }> | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
};

/** Compact Business Risk Report input from Q2-08 (read-only). */
export type BusinessRiskReportInput = {
  riskReportId?: string | null;
  businessBuildMissionId?: string | null;
  businessBlueprintId?: string | null;
  launchPlanId?: string | null;
  businessType?: BusinessType | string | null;
  overallPortfolioRiskRating?: string | null;
  highOrCriticalCount?: number | null;
  risks?: Array<{
    riskId?: string | null;
    riskCategory?: string | null;
    riskDescription?: string | null;
    overallRiskRating?: string | null;
    recommendedMitigation?: string | null;
    confirmed?: boolean | null;
  }> | null;
  missingInformation?: string[] | null;
  assumptions?: string[] | null;
  facts?: string[] | null;
  prioritizedRiskIds?: string[] | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
};

export type SupportingEvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  recordedAt: string;
};

/** Machine-readable Business Approval Pack (Q2-09). */
export type BusinessApprovalPack = {
  approvalPackId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessType: BusinessType | string;
  executiveSummary: string;
  businessOverview: string;
  opportunitySummary: string;
  marketSummary: string;
  businessModelSummary: string;
  blueprintSummary: string;
  launchSummary: string;
  riskSummary: string;
  majorOpportunities: string[];
  majorRisks: string[];
  requiredApprovals: string[];
  outstandingIssues: string[];
  unresolvedRisks: string[];
  recommendation: ApprovalRecommendation;
  recommendationRationale: string;
  requiredGrandKingDecisions: string[];
  supportingEvidence: SupportingEvidenceItem[];
  facts: string[];
  recommendationsOnly: string[];
  assumptions: string[];
  sourceRefs: {
    businessModelId: string | null;
    marketResearchReportId: string | null;
    opportunityEvaluationId: string | null;
    businessBlueprintId: string | null;
    launchPlanId: string | null;
    businessRiskReportId: string | null;
  };
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  packVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverApproveBusiness: true;
  neverLaunchBusiness: true;
  neverModifyPreviousReports: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  distinguishFactsFromRecommendations: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type BusinessApprovalPackWorkerInput = {
  approvalPackId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessModel?: BusinessModelInput | null;
  marketResearch?: MarketResearchInput | null;
  opportunityEvaluation?: OpportunityEvaluationInput | null;
  businessBlueprint?: BusinessBlueprintInput | null;
  launchPlan?: LaunchPlanInput | null;
  businessRiskReport?: BusinessRiskReportInput | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  approveBusiness?: boolean;
  launchBusiness?: boolean;
  modifyPreviousReports?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ210OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BusinessApprovalPackWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessApprovalPackWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BAP-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BusinessApprovalPackWorkerCapability[];
  totalApprovalPacks: number;
  lastBusinessType: BusinessType | string | null;
  lastApprovalPackId: string | null;
  lastRecommendation: ApprovalRecommendation | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type BusinessApprovalPackWorkerCatalog = {
  packVersion: string;
  workerId: string;
  packs: BusinessApprovalPack[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverApproveBusiness: true;
  neverLaunchBusiness: true;
  neverModifyPreviousReports: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type BusinessApprovalPackWorkerRunReport = {
  approvalPackRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_business_model"
    | "receive_market_research"
    | "receive_opportunity_evaluation"
    | "receive_blueprint"
    | "receive_launch_plan"
    | "receive_risk_report"
    | "consolidate_findings"
    | "produce_executive_summary"
    | "produce_approval_pack"
    | "submit_approval_pack"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BusinessApprovalPackWorkerEngineRecord;
  catalog: BusinessApprovalPackWorkerCatalog | null;
  packs: BusinessApprovalPack[];
  latestPack: BusinessApprovalPack | null;
  integrations: IntegrationHandshake[];
  validation: BusinessApprovalPackWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessApprovalPackWorkerState = {
  engineVersion: "PILLOW-BAP-001";
  missionId: "Q2-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessApprovalPackWorkerConfiguration;
  latestReport: BusinessApprovalPackWorkerRunReport | null;
  engineRecord: BusinessApprovalPackWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalApprovalPacks: number;
    lastApprovalPackId: string | null;
    lastRecommendation: ApprovalRecommendation | null;
    notes: string[];
  };
};

export type BusinessApprovalPackWorkerCockpitSnapshot = {
  missionId: "Q2-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalApprovalPacks: number;
  latestApprovalPackId: string | null;
  lastRecommendation: ApprovalRecommendation | null;
  workerId: string;
  neverApproveBusiness: true;
  neverLaunchBusiness: true;
  neverModifyPreviousReports: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
