import type { MissionPlanningEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXECUTION_STEP_IDS,
  INTEGRATION_TARGETS,
  MPENG_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ExecutionStepId = (typeof EXECUTION_STEP_IDS)[number];
export type MpengCapability = (typeof MPENG_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type RepositorySnapshotSummary = {
  repositorySnapshotId: string;
  repositoryFingerprint: string;
  repositoryVersion: string;
  status: "available" | "unavailable";
};

export type MissionAnalysis = {
  missionId: string;
  missionName: string;
  programme: string | null;
  evidenceProvided: boolean;
  analysedAt: string;
};

export type ImplementationDependency = {
  dependencyId: string;
  kind: "repository_intelligence" | "specification" | "integration" | "governance" | "module" | "service";
  description: string;
  source: string;
  required: boolean;
  evidence: string[];
};

export type ExecutionStep = {
  stepId: ExecutionStepId;
  order: number;
  label: string;
  description: string;
  deterministic: true;
};

export type IntegrationPoint = {
  pointId: string;
  target: string;
  kind: "session" | "route" | "runtime" | "audit" | "reporting" | "orchestration" | "knowledge";
  description: string;
  evidence: string[];
};

export type ValidationStrategyItem = {
  itemId: string;
  category: "unit_test" | "regression" | "governance_lock" | "integration" | "acceptance";
  description: string;
  required: boolean;
};

export type AcceptanceCriterion = {
  criterionId: string;
  section: string;
  description: string;
  mappedTo: string;
  required: boolean;
};

export type ImplementationRisk = {
  riskId: string;
  category:
    | "fabrication"
    | "overwrite"
    | "governance_bypass"
    | "missing_rieng"
    | "scope_creep"
    | "dependency_gap"
    | "integration_gap";
  description: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
  evidence: string[];
};

export type MissionPlan = {
  planId: string;
  version: typeof import("./paths.js").MPENG_METADATA_VERSION;
  missionId: string;
  missionName: string;
  repositorySnapshot: RepositorySnapshotSummary;
  dependencies: ImplementationDependency[];
  executionOrder: ExecutionStep[];
  integrationPoints: IntegrationPoint[];
  validationStrategy: ValidationStrategyItem[];
  acceptanceCriteria: AcceptanceCriterion[];
  risks: ImplementationRisk[];
  constraints: string[];
  estimatedScope: {
    complexity: "low" | "medium" | "high";
    stepCount: number;
    dependencyCount: number;
    integrationPointCount: number;
  };
  governanceRequirements: string[];
  timestamp: string;
};

export type Q1303ContractConsumed = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  consumerMissionId: string | null;
  fields: string[];
  evidence: string;
};

export type Q1302Observation = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type Q1303Prerequisite = {
  verified: boolean;
  repositoryIntelligenceEnginePresent: boolean;
  q1303ContractAvailable: boolean;
  outstandingPrerequisiteIssues: string[];
  evidence: string[];
};

export type MpengInput = {
  reportId?: string;
  planId?: string;
  missionId?: string;
  missionName?: string;
  programme?: string;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateRepositoryState?: boolean;
  modifyRepository?: boolean;
  executeImplementation?: boolean;
  bypassGovernance?: boolean;
  ignoreDiscoveredDependencies?: boolean;
  implementQ1304OrLater?: boolean;
  autoDeploy?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type MpengValidation = {
  decision: ValidationStatus;
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type MissionPlanningReport = {
  reportId: string;
  reportVersion: typeof import("./paths.js").MISSION_PLANNING_ENGINE_REPORT_VERSION;
  metadataVersion: typeof import("./paths.js").MPENG_METADATA_VERSION;
  engineId: "PILLOW-MPENG-001";
  timestamp: string;
  runTimestamp: string;
  workerId: string;
  missionId: "Q13-03";
  missionSummary: MissionAnalysis;
  repositoryIntelligenceSummary: {
    reportId: string | null;
    confidenceScore: number | null;
    repositorySnapshot: RepositorySnapshotSummary;
    dependencyNodeCount: number | null;
  };
  dependencySummary: { count: number; requiredCount: number; entries: ImplementationDependency[] };
  executionPlan: ExecutionStep[];
  integrationSummary: { count: number; points: IntegrationPoint[] };
  validationStrategy: ValidationStrategyItem[];
  acceptanceCriteria: AcceptanceCriterion[];
  riskSummary: { count: number; risks: ImplementationRisk[] };
  confidenceScore: number;
  plans: MissionPlan[];
  q1303ContractConsumed: Q1303ContractConsumed;
  q1303Prerequisite: Q1303Prerequisite;
  q1302Observation: Q1302Observation;
  consumableByQ1304: boolean;
  neverImplementQ1304OrLater: true;
  neverModifyRepository: true;
  neverExecuteImplementation: true;
  neverFabricateRepositoryState: true;
  neverBypassGovernance: true;
  neverAutoDeploy: true;
  preservePlanningHistory: true;
  planningOnly: true;
  supportingEvidence: string[];
  outstandingIssues: string[];
  traceabilityRefs: string[];
  validation: MpengValidation;
  historyRefs: string[];
};

export type Q1304ConsumableContract = {
  contractId: string;
  contractVersion: typeof import("./paths.js").MPENG_METADATA_VERSION;
  producedBy: "mission-planning-engine";
  missionId: "Q13-03";
  consumerMissionId: "Q13-04";
  exposedFields: string[];
  planningCatalog: string[];
  notes: string[];
  neverImplementQ1304OrLater: true;
  structuralSignalOnly: true;
  planningPrerequisite: boolean;
};

export type PlanningHistoryEntry = {
  entryId: string;
  timestamp: string;
  reportId: string;
  planId: string;
  missionId: string;
  confidenceScore: number;
  evidence: string[];
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "ready" | "missing";
  details: string;
  timestamp: string;
};

export type MpengEngineRecord = {
  engineVersion: "PILLOW-MPENG-001";
  missionId: "Q13-03";
  workerId: string;
  status: OperationalState;
  healthStatus: EngineHealthStatus;
  supportedCapabilities: MpengCapability[];
  integrationTargets: IntegrationTarget[];
  totalReports: number;
  totalPlans: number;
  lastReportId: string | null;
  lastPlanId: string | null;
  lastConfidenceScore: number | null;
  connectedAt: string | null;
};

export type MissionPlanningEngineState = {
  engineVersion: "PILLOW-MPENG-001";
  missionId: "Q13-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: MissionPlanningEngineConfiguration;
  latestReport: MissionPlanningReport | null;
  latestPlan: MissionPlan | null;
  engineRecord: MpengEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: ValidationStatus | null;
    totalReports: number;
    totalPlans: number;
    lastReportId: string | null;
    lastPlanId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type MissionPlanningEngineCockpitSnapshot = {
  missionId: "Q13-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalPlans: number;
  latestReportId: string | null;
  latestPlanId: string | null;
  workerId: string;
  neverModifyRepository: true;
  neverExecuteImplementation: true;
  neverImplementQ1304OrLater: true;
  neverBypassGovernance: true;
};

export type MpengCatalog = {
  workerId: string;
  reports: Array<{ reportId: string; timestamp: string; confidenceScore: number }>;
  plans: Array<{ planId: string; missionId: string; timestamp: string }>;
  integrations: IntegrationHandshake[];
  planningHistoryCount: number;
};

export type MpengDiagnostics = {
  missionId: "Q13-03";
  workerId: string;
  enabled: boolean;
  reports: number;
  plans: number;
  failureCount: number;
  q1303PrerequisitePresent: boolean;
  readinessScore: number;
  integrations: Array<{ target: string; bound: boolean }>;
  locks: MissionPlanningEngineConfiguration;
};
