import type { SkillToolRouterConfiguration } from "./configuration.js";
import type {
  COST_LEVELS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  ROUTING_FACTORS,
  STR_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RoutingFactor = (typeof ROUTING_FACTORS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type CostLevel = (typeof COST_LEVELS)[number];
export type SkillToolRouterCapability = (typeof STR_CAPABILITIES)[number];

/** Input for Q0-12 — intelligent routing only. */
export type SkillToolRouterInput = {
  executiveRequest: string;
  businessContext?: string | null;
  riskHint?: RiskLevel | null;
  costCeiling?: CostLevel | null;
  preferredCapabilities?: string[];
  preferredWorkerIds?: string[];
  preferredToolIds?: string[];
  requireMultipleWorkers?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWork?: boolean;
  performOrchestration?: boolean;
  replaceWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

/** Worker candidate drawn from Workforce Capability Registry query surface. */
export type RoutableWorker = {
  workerId: string;
  workerName: string;
  department: string;
  capabilities: string[];
  skills: string[];
  approvedTools: string[];
  availability: "available" | "busy" | "offline";
  performanceScore: number;
  authorityLevel: number;
  costProfile: CostLevel;
  securityClearance: "standard" | "elevated" | "restricted";
};

/** Approved tool candidate from registry query surface. */
export type RoutableTool = {
  toolId: string;
  toolName: string;
  compatibleCapabilities: string[];
  availability: "available" | "limited" | "offline";
  securityRating: "standard" | "elevated" | "restricted";
  costProfile: CostLevel;
};

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  factors: string[];
  escalate: boolean;
};

export type CostAssessment = {
  level: CostLevel;
  score: number;
  factors: string[];
  withinCeiling: boolean;
};

export type AlternativeRoute = {
  routeId: string;
  selectedWorkers: string[];
  selectedTools: string[];
  confidenceScore: number;
  reason: string;
};

/** Machine-readable Routing Record (Q0-12). */
export type RoutingRecord = {
  routingId: string;
  timestamp: string;
  executiveRequest: string;
  requiredCapabilities: string[];
  selectedWorkers: string[];
  selectedTools: string[];
  routingReason: string;
  riskAssessment: RiskAssessment;
  costAssessment: CostAssessment;
  confidenceScore: number;
  alternativeRoutes: AlternativeRoute[];
  metadataVersion: string;
  routingTraceId: string;
  routingFactorsApplied: string[];
  multipleWorkersRequired: boolean;
  escalationRecommended: boolean;
  validationStatus: ValidationStatus;
  /** Explicit Q0-12 boundaries. */
  neverExecuteWork: true;
  neverPerformOrchestration: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workExecuted: false;
  orchestrationPerformed: false;
  workersReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveRoutingTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RoutingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SkillToolRouterEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-STR-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SkillToolRouterCapability[];
  totalRoutingRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type SkillToolRouterRunReport = {
  routingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "route"
    | "analyse_capabilities"
    | "query_registry"
    | "match_workers"
    | "match_tools"
    | "recommend"
    | "list_routes"
    | "validate_routing"
    | "diagnostics";
  engineRecord: SkillToolRouterEngineRecord;
  records: RoutingRecord[];
  workers: RoutableWorker[];
  tools: RoutableTool[];
  requiredCapabilities: string[];
  validation: RoutingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SkillToolRouterState = {
  engineVersion: "PILLOW-STR-001";
  missionId: "Q0-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: SkillToolRouterConfiguration;
  latestReport: SkillToolRouterRunReport | null;
  engineRecord: SkillToolRouterEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRoutingRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type SkillToolRouterCockpitSnapshot = {
  missionId: "Q0-12";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalRoutingRecords: number;
  latestRoutingId: string | null;
  lastConfidenceScore: number | null;
  neverExecuteWork: true;
  neverPerformOrchestration: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
