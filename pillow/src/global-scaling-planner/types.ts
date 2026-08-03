/** PILLOW-GSP-001 — Global Scaling Planner types (X3-14). */



import type {

  SCALING_OPERATIONS,

  EXPANSION_PRIORITIES,

  ENGINE_STATUSES,

  HEALTH_STATUSES,

  OPERATIONAL_STATES,

  GSP_CAPABILITIES,

  VALIDATION_STATUSES,

} from "./paths.js";

import type { GlobalScalingPlannerConfiguration } from "./configuration.js";



export type GlobalScalingPlannerVersion = "PILLOW-GSP-001";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ScalingOperation = (typeof SCALING_OPERATIONS)[number];

export type ExpansionPriority = (typeof EXPANSION_PRIORITIES)[number];

export type GspCapability = (typeof GSP_CAPABILITIES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type HealthStatus = (typeof HEALTH_STATUSES)[number];



export type GlobalScalingRecord = {

  globalScalingId: string;

  timestamp: string;

  companyReference: string;

  targetRegion: string;

  targetCountry: string;

  expansionReadinessScore: number;

  regionalOpportunityScore: number;

  expansionPriority: ExpansionPriority;

  recommendationSummary: string;

  validationStatus: ValidationStatus;

  metadataVersion: string;

  neverRecommendWithoutValidatedReadiness: true;

  structuralSignalOnly: true;

  sensitiveOperationalData: false;

};



export type GlobalScalingPlannerRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: string;

  currentOperationalState: OperationalState;

  healthStatus: HealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: GspCapability[];

  frameworkModuleId: string | null;

  dependencyPresence: {

    autonomousScalingFramework: boolean;

    winningProductDetector: boolean;

    scalingDecisionEngine: boolean;

    capacityPlanningEngine: boolean;

    marketingScaleEngine: boolean;

    supplierScaleEngine: boolean;

    financialScaleEngine: boolean;

    workforceIntelligence: boolean;

    executiveScalingDashboard: boolean;

    bottleneckIntelligence: boolean;

    operationalElasticityEngine: boolean;

    performancePreservationEngine: boolean;

    scalingRiskMonitor: boolean;

  };

  metadataVersion: string;

};



export type GlobalExpansionRecommendation = {

  recommendationId: string;

  timestamp: string;

  companyReference: string;

  targetRegion: string;

  targetCountry: string;

  recommendationSummary: string;

  expansionPriority: ExpansionPriority;

  expansionReadinessScore: number;

  regionalOpportunityScore: number;

  structuralSignalOnly: true;

  neverRecommendWithoutValidatedReadiness: true;

};



export type GlobalScalingValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



export type GspRunReport = {

  globalScalingPlannerRunReportId: string;

  runTimestamp: string;

  action:

    | "connect"

    | "evaluate_international_expansion_readiness"

    | "identify_target_regions"

    | "identify_target_countries"

    | "evaluate_regional_demand"

    | "evaluate_regional_operational_readiness"

    | "evaluate_supplier_readiness_by_region"

    | "evaluate_financial_readiness_for_expansion"

    | "rank_international_scaling_opportunities"

    | "recommend_global_expansion"

    | "diagnostics";

  engineRecord: GlobalScalingPlannerRecord;

  globalScalingRecords: GlobalScalingRecord[];

  recommendations: GlobalExpansionRecommendation[];

  validation: GlobalScalingValidationReport;

  durationMs: number;

  metadataVersion: string;

};



export type GspHealthReport = {

  status: HealthStatus;

  healthScore: number;

  engineEnabled: boolean;

  lastOperationAt: string | null;

  lastValidationDecision: GlobalScalingValidationReport["decision"] | null;

  consecutiveFailures: number;

  recoveryAttempts: number;

  totalGlobalScalingRecords: number;

  highPriorityCount: number;

  averageReadinessScore: number;

  notes: string[];

};



export type GspPerformanceStats = {

  totalOperations: number;

  successfulOperations: number;

  failedOperations: number;

  evaluationRuns: number;

  regionsIdentified: number;

  countriesIdentified: number;

  recommendationsGenerated: number;

  retryAttempts: number;

  averageOperationDurationMs: number;

  peakOperationDurationMs: number;

};



export type GlobalScalingPlannerState = {

  engineVersion: GlobalScalingPlannerVersion;

  missionId: "X3-14";

  status: EngineStatus;

  initializedAt: string;

  configuration: GlobalScalingPlannerConfiguration;

  latestReport: GspRunReport | null;

  engineRecord: GlobalScalingPlannerRecord | null;

  health: GspHealthReport;

  performance: GspPerformanceStats;

};



export type GspCockpitSnapshot = {

  engineStatus: EngineStatus;

  healthStatus: HealthStatus;

  operationalState: OperationalState | null;

  lastDecision: GlobalScalingValidationReport["decision"] | null;

  totalGlobalScalingRecords: number;

  highPriorityCount: number;

  averageReadinessScore: number;

  frameworkRegistered: boolean;

  dependenciesConnected: number;

  recentLogs: string[];

};



export type GspLogEntry = {

  logId: string;

  timestamp: string;

  event: string;

  level: "debug" | "info" | "warn" | "error";

  details: string;

};



export type ConnectGlobalScalingPlannerInput = Record<string, unknown>;



export type GlobalScalingInput = {

  companyReference?: string;

  targetRegionHint?: string;

  targetCountryHint?: string;

  expansionReadinessHint?: number;

  regionalOpportunityHint?: number;

  expansionPriorityHint?: ExpansionPriority;

  validated?: boolean;

};



export type RunGspDiagnosticsInput = Record<string, unknown>;


