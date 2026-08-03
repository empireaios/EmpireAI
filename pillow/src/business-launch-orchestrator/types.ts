/** PILLOW-BLO-001 — Business Launch Orchestrator types (X1-11). */

import type {
  BLO_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LAUNCH_STAGES,
  LAUNCH_STATUSES,
  OPERATIONAL_STATES,
  RECOVERY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";

export type BusinessLaunchOrchestratorVersion = "PILLOW-BLO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type BloCapability = (typeof BLO_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type LaunchStage = (typeof LAUNCH_STAGES)[number];
export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

export type LaunchOrchestratorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BloCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    brandCreationEngine: boolean;
    domainDigitalAssetPlanner: boolean;
    storeGenerationEngine: boolean;
    pricingStrategyEngine: boolean;
    launchReadinessValidator: boolean;
  };
  metadataVersion: string;
};

export type BusinessLaunchRecord = {
  launchId: string;
  timestamp: string;
  companyReference: string;
  launchWorkflowReference: string;
  readinessReference: string;
  brandReference: string;
  digitalAssetPlanReference: string;
  storefrontReference: string;
  pricingReference: string;
  currentLaunchStage: LaunchStage;
  launchProgress: number;
  launchStatus: LaunchStatus;
  recoveryStatus: RecoveryStatus;
  dependencySummary: string;
  launchReportSummary: string;
  launchFingerprint: string;
  structuralSignalOnly: true;
  launchedWithoutReadinessValidation: false;
  fabricatedLaunchFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LaunchOrchestratorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LaunchOrchestratorRunReport = {
  launchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "orchestrate_launch"
    | "execute_launch_workflow"
    | "manage_launch_stages"
    | "coordinate_dependencies"
    | "track_launch_progress"
    | "detect_launch_failures"
    | "coordinate_launch_recovery"
    | "generate_launch_report";
  engineRecord: LaunchOrchestratorEngineRecord;
  launchRecords: BusinessLaunchRecord[];
  validation: LaunchOrchestratorValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LaunchOrchestratorHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LaunchOrchestratorValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLaunchRecords: number;
  notes: string[];
};

export type LaunchOrchestratorPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  launchesOrchestrated: number;
  workflowRuns: number;
  dependencyRuns: number;
  recoveryRuns: number;
  reportRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LaunchOrchestratorLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BusinessLaunchOrchestratorState = {
  engineVersion: BusinessLaunchOrchestratorVersion;
  missionId: "X1-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessLaunchOrchestratorConfiguration;
  latestReport: LaunchOrchestratorRunReport | null;
  engineRecord: LaunchOrchestratorEngineRecord | null;
  health: LaunchOrchestratorHealthReport;
  performance: LaunchOrchestratorPerformanceStats;
};

export type LaunchOrchestratorCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LaunchOrchestratorValidationReport["decision"] | null;
  totalLaunchRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBusinessLaunchOrchestratorInput = {
  forceReconnect?: boolean;
};

export type OrchestrateLaunchInput = {
  companyReference?: string;
  readinessReference?: string;
  brandReference?: string;
  digitalAssetPlanReference?: string;
  storefrontReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};

export type LaunchActionInput = {
  launchId?: string;
  companyReference?: string;
  readinessReference?: string;
  brandReference?: string;
  digitalAssetPlanReference?: string;
  storefrontReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};
