import type { StrategicRecommendationEngineConfiguration } from "./configuration.js";
import type {
  APPROVAL_REQUIREMENTS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PRIORITY_LEVELS,
  REC_CAPABILITIES,
  RECOMMENDATION_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type BuiltinRecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type ApprovalRequirement = (typeof APPROVAL_REQUIREMENTS)[number];
export type StrategicRecommendationCapability = (typeof REC_CAPABILITIES)[number];

/** Input for Q0-07 — empire state signals for recommendation analysis only. */
export type StrategicRecommendationInput = {
  empireStateHints?: string[];
  activeBusinessHints?: string[];
  businessPerformanceHints?: string[];
  workforcePerformanceHints?: string[];
  infrastructureHints?: string[];
  bottleneckHints?: string[];
  opportunityHints?: string[];
  riskHints?: string[];
  categoryHints?: string[];
  evidenceHints?: string[];
  maxRecommendations?: number;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeRecommendations?: boolean;
  assignWorkers?: boolean;
  approveActions?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type AnalysisDimensionScore = {
  dimensionId: string;
  label: string;
  score: number;
  findings: string[];
};

export type EmpireStateAnalysis = {
  analysisId: string;
  timestamp: string;
  overallHealthScore: number;
  dimensions: AnalysisDimensionScore[];
  opportunitiesDetected: string[];
  risksDetected: string[];
  bottlenecksDetected: string[];
  summary: string;
};

/** Machine-readable Recommendation Package (Q0-07). */
export type RecommendationPackage = {
  recommendationId: string;
  timestamp: string;
  executiveCategory: string;
  recommendationTitle: string;
  executiveSummary: string;
  businessImpact: string;
  strategicValue: number;
  estimatedBenefit: string;
  estimatedCost: string;
  riskAssessment: string[];
  confidenceScore: number;
  supportingEvidence: string[];
  dependencies: string[];
  approvalRequirement: ApprovalRequirement;
  priority: PriorityLevel;
  metadataVersion: string;
  recommendationTraceId: string;
  rationale: string;
  rankScore: number;
  validationStatus: ValidationStatus;
  /** Explicit Q0-07 boundaries. */
  neverExecuteRecommendations: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  recommendationExecuted: false;
  workersAssigned: false;
  actionsApproved: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveRecommendationTraceability: true;
  preserveAuditability: true;
  preserveRecommendationIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RecommendationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type StrategicRecommendationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-REC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: StrategicRecommendationCapability[];
  totalRecommendations: number;
  lastAnalysisId: string | null;
  metadataVersion: string;
};

export type StrategicRecommendationRunReport = {
  recommendationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "analyse_state"
    | "generate_recommendations"
    | "rank_recommendations"
    | "produce_packages"
    | "validate_recommendations"
    | "diagnostics";
  engineRecord: StrategicRecommendationEngineRecord;
  analysis: EmpireStateAnalysis | null;
  recommendations: RecommendationPackage[];
  validation: RecommendationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type StrategicRecommendationEngineState = {
  engineVersion: "PILLOW-REC-001";
  missionId: "Q0-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: StrategicRecommendationEngineConfiguration;
  latestReport: StrategicRecommendationRunReport | null;
  engineRecord: StrategicRecommendationEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRecommendations: number;
    notes: string[];
  };
};

export type StrategicRecommendationCockpitSnapshot = {
  missionId: "Q0-07";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalRecommendations: number;
  latestRecommendationId: string | null;
  lastAnalysisId: string | null;
  neverExecuteRecommendations: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
