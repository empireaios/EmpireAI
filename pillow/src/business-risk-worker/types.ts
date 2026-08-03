import type { BusinessRiskWorkerConfiguration } from "./configuration.js";
import type {
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  IMPACT_LEVELS,
  INTEGRATION_TARGETS,
  LIKELIHOOD_LEVELS,
  OVERALL_RISK_RATINGS,
  BRW_CAPABILITIES,
  OPERATIONAL_STATES,
  RISK_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number] | string;
export type LikelihoodLevel = (typeof LIKELIHOOD_LEVELS)[number];
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];
export type OverallRiskRating = (typeof OVERALL_RISK_RATINGS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type BusinessRiskWorkerCapability = (typeof BRW_CAPABILITIES)[number];

/** Compact Business Blueprint input from Q2-06. */
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
  dependencies?: Array<{ description?: string | null; source?: string | null }> | null;
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

/** Compact Launch Plan input from Q2-07. */
export type LaunchPlanInput = {
  launchPlanId?: string | null;
  businessBuildMissionId?: string | null;
  businessBlueprintId?: string | null;
  businessType?: BusinessType | string | null;
  launchObjective?: string | null;
  launchStages?: Array<{ stageKey?: string | null; name?: string | null }> | null;
  milestones?: Array<{ milestoneId?: string | null; name?: string | null }> | null;
  tasks?: Array<{ taskId?: string | null; name?: string | null }> | null;
  requiredWorkforce?: Array<{ workerRole?: string | null; priority?: string | null }> | null;
  requiredTools?: string[] | null;
  approvalCheckpoints?: Array<{ checkpointId?: string | null; name?: string | null }> | null;
  validationCheckpoints?: Array<{ checkpointId?: string | null; name?: string | null }> | null;
  launchPrerequisites?: string[] | null;
  blockers?: Array<{
    description?: string | null;
    severity?: string | null;
  }> | null;
  rollbackConditions?: Array<{
    description?: string | null;
    action?: string | null;
    trigger?: string | null;
  }> | null;
  missingPrerequisites?: string[] | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
};

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedCategory: RiskCategory;
  recordedAt: string;
};

/** Individual risk entry matching the Business Risk Report minimum structure. */
export type RiskEntry = {
  riskId: string;
  riskCategory: RiskCategory;
  riskDescription: string;
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  likelihoodScore: number;
  impactScore: number;
  overallRiskRating: OverallRiskRating;
  overallRiskScore: number;
  recommendedMitigation: string;
  residualRisk: OverallRiskRating;
  supportingEvidence: EvidenceItem[];
  confirmed: boolean;
  priorityRank: number;
};

/** Machine-readable Business Risk Report (Q2-08). */
export type BusinessRiskReport = {
  riskReportId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessBlueprintId: string;
  launchPlanId: string;
  businessType: BusinessType | string;
  risks: RiskEntry[];
  /** Convenience projection of highest-severity entries for executive views. */
  prioritizedRiskIds: string[];
  highOrCriticalCount: number;
  overallPortfolioRiskRating: OverallRiskRating;
  facts: string[];
  assumptions: string[];
  missingInformation: string[];
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverRemoveRisksAutomatically: true;
  neverApproveBusiness: true;
  neverRejectBusiness: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  evidenceBasedFindings: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type BusinessRiskWorkerInput = {
  riskReportId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessBlueprint?: BusinessBlueprintInput | null;
  launchPlan?: LaunchPlanInput | null;
  businessBlueprintId?: string | null;
  launchPlanId?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  removeRisksAutomatically?: boolean;
  approveBusiness?: boolean;
  rejectBusiness?: boolean;
  launchBusiness?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ209OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BusinessRiskWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessRiskWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BusinessRiskWorkerCapability[];
  totalRiskReports: number;
  lastBusinessType: BusinessType | string | null;
  lastRiskReportId: string | null;
  lastPortfolioRiskRating: OverallRiskRating | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type BusinessRiskWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  riskCategories: string[];
  reports: BusinessRiskReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverRemoveRisksAutomatically: true;
  neverApproveBusiness: true;
  neverRejectBusiness: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type BusinessRiskWorkerRunReport = {
  riskRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_blueprint"
    | "receive_launch_plan"
    | "identify_risks"
    | "score_risks"
    | "recommend_mitigations"
    | "produce_risk_report"
    | "submit_risk_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BusinessRiskWorkerEngineRecord;
  catalog: BusinessRiskWorkerCatalog | null;
  reports: BusinessRiskReport[];
  latestReport: BusinessRiskReport | null;
  integrations: IntegrationHandshake[];
  validation: BusinessRiskWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessRiskWorkerState = {
  engineVersion: "PILLOW-BRW-001";
  missionId: "Q2-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessRiskWorkerConfiguration;
  latestReport: BusinessRiskWorkerRunReport | null;
  engineRecord: BusinessRiskWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRiskReports: number;
    lastRiskReportId: string | null;
    lastPortfolioRiskRating: OverallRiskRating | null;
    notes: string[];
  };
};

export type BusinessRiskWorkerCockpitSnapshot = {
  missionId: "Q2-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRiskReports: number;
  latestRiskReportId: string | null;
  lastPortfolioRiskRating: OverallRiskRating | null;
  workerId: string;
  neverRemoveRisksAutomatically: true;
  neverApproveBusiness: true;
  neverRejectBusiness: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
