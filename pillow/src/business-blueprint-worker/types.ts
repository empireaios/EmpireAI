import type { BusinessBlueprintWorkerConfiguration } from "./configuration.js";
import type {
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  BBW_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type BusinessBlueprintWorkerCapability = (typeof BBW_CAPABILITIES)[number];

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
    demandLevel?: string | null;
    summary?: string | null;
  } | null;
  opportunitySize?: {
    opportunityLevel?: string | null;
    summary?: string | null;
  } | null;
  industryTrends?: string[] | null;
  barriersToEntry?: string[] | null;
  risks?: Array<{ description?: string | null; severity?: string | null }> | null;
  confidenceScore?: number | null;
};

/** Compact Opportunity Evaluation Report input from Q2-05. */
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
  recommendation?: "Proceed" | "Improve" | "Reject" | string | null;
  confidenceScore?: number | null;
  sourceBusinessModelId?: string | null;
  sourceMarketResearchReportId?: string | null;
};

export type WorkflowStep = {
  stepId: string;
  name: string;
  description: string;
  ownerWorkerRole: string;
  dependsOn: string[];
};

export type RequiredWorkerSpec = {
  workerRole: string;
  purpose: string;
  skills: string[];
  priority: "critical" | "high" | "medium";
};

export type MilestoneSpec = {
  milestoneId: string;
  name: string;
  description: string;
  sequence: number;
  dependsOn: string[];
  successCriteria: string[];
};

export type DependencySpec = {
  dependencyId: string;
  description: string;
  source: "business_model" | "market_research" | "opportunity_evaluation" | "blueprint";
  blocks: string[];
};

export type BusinessArchitecture = {
  architectureSummary: string;
  deliveryChannels: string[];
  revenueModel: string;
  costModel: string;
  operatingModel: string;
  targetMarket: string;
  customerProblemsAddressed: string[];
};

/** Machine-readable Business Blueprint (Q2-06). */
export type BusinessBlueprint = {
  blueprintId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessType: BusinessType | string;
  businessObjective: string;
  productsServices: string[];
  customerSegments: string[];
  valueProposition: string;
  operationalWorkflow: WorkflowStep[];
  requiredWorkers: RequiredWorkerSpec[];
  requiredIntegrations: string[];
  requiredAssets: string[];
  milestones: MilestoneSpec[];
  dependencies: DependencySpec[];
  metadataVersion: string;
  blueprintVersion: string;
  businessArchitecture: BusinessArchitecture;
  sourceBusinessModelId: string | null;
  sourceMarketResearchReportId: string | null;
  sourceOpportunityEvaluationId: string | null;
  sourceIntentId: string | null;
  originalCommand: string | null;
  approvedOpportunityRecommendation: string;
  overallOpportunityScore: number | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverExecuteBusiness: true;
  neverLaunchProducts: true;
  neverCreateBranding: true;
  neverBuildWebsites: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  canonicalBlueprint: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type BusinessBlueprintWorkerInput = {
  blueprintId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessModel?: BusinessModelInput | null;
  marketResearch?: MarketResearchInput | null;
  opportunityEvaluation?: OpportunityEvaluationInput | null;
  businessModelId?: string | null;
  marketResearchReportId?: string | null;
  opportunityEvaluationId?: string | null;
  originalCommand?: string | null;
  sourceIntentId?: string | null;
  businessObjective?: string | null;
  /** Reflects prior approval of the opportunity — BBW never approves itself. */
  opportunityApproved?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeBusiness?: boolean;
  launchProducts?: boolean;
  createBranding?: boolean;
  buildWebsites?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ207OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BusinessBlueprintWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessBlueprintWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BBW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BusinessBlueprintWorkerCapability[];
  totalBlueprints: number;
  lastBusinessType: BusinessType | string | null;
  lastBlueprintId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type BusinessBlueprintWorkerCatalog = {
  blueprintVersion: string;
  workerId: string;
  blueprints: BusinessBlueprint[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteBusiness: true;
  neverLaunchProducts: true;
  neverCreateBranding: true;
  neverBuildWebsites: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type BusinessBlueprintWorkerRunReport = {
  blueprintRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_business_model"
    | "receive_market_research"
    | "receive_opportunity_evaluation"
    | "consolidate"
    | "define_architecture"
    | "define_workflow"
    | "define_workers"
    | "define_milestones"
    | "produce_blueprint"
    | "submit_blueprint"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BusinessBlueprintWorkerEngineRecord;
  catalog: BusinessBlueprintWorkerCatalog | null;
  blueprints: BusinessBlueprint[];
  latestBlueprint: BusinessBlueprint | null;
  integrations: IntegrationHandshake[];
  validation: BusinessBlueprintWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessBlueprintWorkerState = {
  engineVersion: "PILLOW-BBW-001";
  missionId: "Q2-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessBlueprintWorkerConfiguration;
  latestReport: BusinessBlueprintWorkerRunReport | null;
  engineRecord: BusinessBlueprintWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalBlueprints: number;
    lastBlueprintId: string | null;
    notes: string[];
  };
};

export type BusinessBlueprintWorkerCockpitSnapshot = {
  missionId: "Q2-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalBlueprints: number;
  latestBlueprintId: string | null;
  workerId: string;
  neverExecuteBusiness: true;
  neverLaunchProducts: true;
  neverCreateBranding: true;
  neverBuildWebsites: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
