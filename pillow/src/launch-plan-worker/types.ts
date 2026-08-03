import type { LaunchPlanWorkerConfiguration } from "./configuration.js";
import type {
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LAUNCH_STAGE_CATALOG,
  LPW_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type LaunchStageKey = (typeof LAUNCH_STAGE_CATALOG)[number] | string;
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LaunchPlanWorkerCapability = (typeof LPW_CAPABILITIES)[number];

/** Compact Business Blueprint input from Q2-06. */
export type BusinessBlueprintInput = {
  blueprintId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessObjective?: string | null;
  productsServices?: string[] | null;
  customerSegments?: string[] | null;
  valueProposition?: string | null;
  operationalWorkflow?: Array<{
    stepId?: string | null;
    name?: string | null;
    description?: string | null;
    ownerWorkerRole?: string | null;
    dependsOn?: string[] | null;
  }> | null;
  requiredWorkers?: Array<{
    workerRole?: string | null;
    purpose?: string | null;
    skills?: string[] | null;
    priority?: "critical" | "high" | "medium" | string | null;
  }> | null;
  requiredIntegrations?: string[] | null;
  requiredAssets?: string[] | null;
  milestones?: Array<{
    milestoneId?: string | null;
    name?: string | null;
    description?: string | null;
    sequence?: number | null;
    dependsOn?: string[] | null;
    successCriteria?: string[] | null;
  }> | null;
  dependencies?: Array<{
    dependencyId?: string | null;
    description?: string | null;
    source?: string | null;
    blocks?: string[] | null;
  }> | null;
  businessArchitecture?: {
    architectureSummary?: string | null;
    deliveryChannels?: string[] | null;
    revenueModel?: string | null;
    costModel?: string | null;
    operatingModel?: string | null;
    targetMarket?: string | null;
    customerProblemsAddressed?: string[] | null;
  } | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
  approvedOpportunityRecommendation?: string | null;
  overallOpportunityScore?: number | null;
  sourceBusinessModelId?: string | null;
  sourceMarketResearchReportId?: string | null;
  sourceOpportunityEvaluationId?: string | null;
  sourceIntentId?: string | null;
  originalCommand?: string | null;
};

export type LaunchStage = {
  stageId: string;
  stageKey: LaunchStageKey;
  name: string;
  description: string;
  sequence: number;
  dependsOnStages: string[];
  derivedFrom: string[];
};

export type LaunchMilestone = {
  milestoneId: string;
  name: string;
  description: string;
  stageId: string;
  sequence: number;
  measurableCriteria: string[];
  dependsOn: string[];
};

export type LaunchTask = {
  taskId: string;
  name: string;
  description: string;
  stageId: string;
  ownerWorkerRole: string;
  dependsOn: string[];
  requiredTools: string[];
};

export type LaunchDependency = {
  dependencyId: string;
  description: string;
  from: string;
  to: string;
  kind: "stage" | "task" | "milestone" | "external";
};

export type RequiredWorkforceSpec = {
  workerRole: string;
  workforceCategory: string;
  purpose: string;
  skills: string[];
  priority: "critical" | "high" | "medium";
};

export type CheckpointSpec = {
  checkpointId: string;
  name: string;
  stageId: string;
  description: string;
  authority: "pillow" | "grand_king" | "factory_lead" | "system";
  requiredEvidence: string[];
};

export type BlockerSpec = {
  blockerId: string;
  description: string;
  severity: "low" | "moderate" | "high";
  blocks: string[];
  resolutionHint: string;
};

export type RollbackCondition = {
  conditionId: string;
  description: string;
  trigger: string;
  action: "pause" | "rollback" | "escalate";
  targetStageId: string | null;
};

/** Machine-readable Launch Plan (Q2-07). Distinct from commerce-intelligence BusinessLaunchPlan. */
export type LaunchPlan = {
  launchPlanId: string;
  timestamp: string;
  businessBuildMissionId: string;
  businessBlueprintId: string;
  businessType: BusinessType | string;
  launchObjective: string;
  launchStages: LaunchStage[];
  milestones: LaunchMilestone[];
  tasks: LaunchTask[];
  dependencies: LaunchDependency[];
  requiredWorkforce: RequiredWorkforceSpec[];
  requiredTools: string[];
  approvalCheckpoints: CheckpointSpec[];
  validationCheckpoints: CheckpointSpec[];
  launchPrerequisites: string[];
  blockers: BlockerSpec[];
  rollbackConditions: RollbackCondition[];
  completionCriteria: string[];
  missingPrerequisites: string[];
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  planVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  missionCoordinationRef: string | null;
  approvalRouterRef: string | null;
  workerId: string;
  neverExecuteLaunchTasks: true;
  neverAssignWorkersDirectly: true;
  neverCreateBusinessAssets: true;
  neverConnectExternalAccounts: true;
  neverLaunchBusiness: true;
  neverApproveLaunch: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type LaunchPlanWorkerInput = {
  launchPlanId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessBlueprint?: BusinessBlueprintInput | null;
  businessBlueprintId?: string | null;
  launchObjective?: string | null;
  /** Reflects prior blueprint approval — LPW never approves itself. */
  blueprintApproved?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeLaunchTasks?: boolean;
  assignWorkersDirectly?: boolean;
  createBusinessAssets?: boolean;
  connectExternalAccounts?: boolean;
  launchBusiness?: boolean;
  approveLaunch?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ208OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LaunchPlanWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LaunchPlanWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LaunchPlanWorkerCapability[];
  totalLaunchPlans: number;
  lastBusinessType: BusinessType | string | null;
  lastLaunchPlanId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LaunchPlanWorkerCatalog = {
  planVersion: string;
  workerId: string;
  launchPlans: LaunchPlan[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteLaunchTasks: true;
  neverAssignWorkersDirectly: true;
  neverCreateBusinessAssets: true;
  neverConnectExternalAccounts: true;
  neverLaunchBusiness: true;
  neverApproveLaunch: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type LaunchPlanWorkerRunReport = {
  launchPlanRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_blueprint"
    | "identify_stages"
    | "define_milestones"
    | "define_tasks"
    | "define_dependencies"
    | "define_checkpoints"
    | "define_blockers"
    | "produce_launch_plan"
    | "submit_launch_plan"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LaunchPlanWorkerEngineRecord;
  catalog: LaunchPlanWorkerCatalog | null;
  launchPlans: LaunchPlan[];
  latestLaunchPlan: LaunchPlan | null;
  integrations: IntegrationHandshake[];
  validation: LaunchPlanWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LaunchPlanWorkerState = {
  engineVersion: "PILLOW-LPW-001";
  missionId: "Q2-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: LaunchPlanWorkerConfiguration;
  latestReport: LaunchPlanWorkerRunReport | null;
  engineRecord: LaunchPlanWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalLaunchPlans: number;
    lastLaunchPlanId: string | null;
    notes: string[];
  };
};

export type LaunchPlanWorkerCockpitSnapshot = {
  missionId: "Q2-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalLaunchPlans: number;
  latestLaunchPlanId: string | null;
  workerId: string;
  neverExecuteLaunchTasks: true;
  neverAssignWorkersDirectly: true;
  neverCreateBusinessAssets: true;
  neverConnectExternalAccounts: true;
  neverLaunchBusiness: true;
  neverApproveLaunch: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
