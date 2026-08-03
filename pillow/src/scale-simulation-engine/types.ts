/** PILLOW-SSI-001 — Scale Simulation Engine types (X3-18). */

import type {
  SIMULATION_OPERATIONS,
  SIMULATION_SCENARIOS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SSI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ScaleSimulationEngineConfiguration } from "./configuration.js";

export type ScaleSimulationEngineVersion = "PILLOW-SSI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SimulationOperation = (typeof SIMULATION_OPERATIONS)[number];
export type SimulationScenario = (typeof SIMULATION_SCENARIOS)[number];
export type SsiCapability = (typeof SSI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ScaleSimulationRecord = {
  simulationId: string;
  timestamp: string;
  companyReference: string;
  simulationScenario: string;
  revenueProjection: number;
  profitProjection: number;
  capacityProjection: number;
  riskProjection: number;
  overallSimulationScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverExecuteSimulatedActionsAgainstProduction: true;
  structuralSignalOnly: true;
  simulationOnly: true;
  sensitiveOperationalData: false;
  sensitiveFinancialData: false;
};

export type ScaleSimulationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SsiCapability[];
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
    globalScalingPlanner: boolean;
    autonomousGrowthOptimizer: boolean;
    revenueAccelerationEngine: boolean;
    profitScalingEngine: boolean;
  };
  metadataVersion: string;
};

export type ScaleSimulationRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  simulationScenario: string;
  recommendationSummary: string;
  overallSimulationScore: number;
  revenueProjection: number;
  profitProjection: number;
  capacityProjection: number;
  riskProjection: number;
  structuralSignalOnly: true;
  neverExecuteSimulatedActionsAgainstProduction: true;
  simulationOnly: true;
};

export type SimulationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SsiRunReport = {
  scaleSimulationEngineRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "simulate_scaling_scenarios"
    | "simulate_revenue_outcomes"
    | "simulate_profit_outcomes"
    | "simulate_operational_capacity"
    | "simulate_supplier_capacity"
    | "simulate_workforce_utilization"
    | "simulate_financial_impact"
    | "simulate_scaling_risks"
    | "compare_scaling_scenarios"
    | "rank_simulation_outcomes"
    | "recommend_from_simulation"
    | "diagnostics";
  engineRecord: ScaleSimulationEngineRecord;
  simulationRecords: ScaleSimulationRecord[];
  recommendations: ScaleSimulationRecommendation[];
  validation: SimulationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SsiHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SimulationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSimulationRecords: number;
  highScoreCount: number;
  averageSimulationScore: number;
  notes: string[];
};

export type SsiPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  simulationRuns: number;
  comparisonsPerformed: number;
  rankingsPerformed: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ScaleSimulationEngineState = {
  engineVersion: ScaleSimulationEngineVersion;
  missionId: "X3-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: ScaleSimulationEngineConfiguration;
  latestReport: SsiRunReport | null;
  engineRecord: ScaleSimulationEngineRecord | null;
  health: SsiHealthReport;
  performance: SsiPerformanceStats;
};

export type SsiCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: SimulationValidationReport["decision"] | null;
  totalSimulationRecords: number;
  highScoreCount: number;
  averageSimulationScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type SsiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectScaleSimulationEngineInput = Record<string, unknown>;

export type ScaleSimulationInput = {
  companyReference?: string;
  simulationScenarioHint?: SimulationScenario | string;
  revenueProjectionHint?: number;
  profitProjectionHint?: number;
  capacityProjectionHint?: number;
  riskProjectionHint?: number;
  overallSimulationScoreHint?: number;
  validated?: boolean;
  executeAgainstProduction?: boolean;
};

export type RunSsiDiagnosticsInput = Record<string, unknown>;
