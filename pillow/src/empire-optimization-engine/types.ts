import type { EmpireOptimizationEngineConfiguration } from "./configuration.js";
import type { EOE_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, OPERATIONAL_STATES, OPTIMIZATION_CATEGORIES, VALIDATION_STATUSES } from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireOptimizationCapability = (typeof EOE_CAPABILITIES)[number];
export type EmpireOptimizationInput = {
  companyReference?: string; optimizationCategory?: OptimizationCategory; currentPerformance?: number;
  expectedImprovement?: number; priorityScore?: number; recommendationSummary?: string; validated?: boolean;
  optimizationId?: string; outcomeScore?: number;
};
export type OptimizationRecord = {
  optimizationId: string; timestamp: string; companyReference: string; optimizationCategory: OptimizationCategory;
  currentPerformance: number; expectedImprovement: number; priorityScore: number; recommendationSummary: string;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverExecuteUnapprovedOptimizationActionsAutomatically: true; preserveOptimizationTraceability: true;
  preserveAuditability: true; optimizationTraceId: string; unvalidatedClaim: "none"; approvedForExecution: false;
};
export type OptimizationRecommendation = {
  recommendationId: string; timestamp: string; companyReference: string; recommendationSummary: string;
  priorityScore: number; optimizationId: string | null; structuralSignalOnly: true;
  neverExecuteUnapprovedOptimizationActionsAutomatically: true; approvedForExecution: false; unvalidatedClaim: "none";
};
export type OptimizationValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string; };
export type EmpireOptimizationEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-EOE-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireOptimizationCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean; empireMemoryEngine: boolean; empireKnowledgeEngine: boolean }; metadataVersion: string;
};
export type EmpireOptimizationRunReport = { optimizationRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireOptimizationEngineRecord; optimizationRecords: OptimizationRecord[]; recommendations: OptimizationRecommendation[]; validation: OptimizationValidationReport; durationMs: number; metadataVersion: string; };
export type EmpireOptimizationState = {
  engineVersion: "PILLOW-EOE-001"; missionId: "X5-04"; status: EngineStatus; initializedAt: string;
  configuration: EmpireOptimizationEngineConfiguration; latestReport: EmpireOptimizationRunReport | null; engineRecord: EmpireOptimizationEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: OptimizationValidationReport["decision"] | null; totalOptimizationRecords: number; notes: string[] };
};
export type EmpireOptimizationCockpitSnapshot = { engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null; lastDecision: OptimizationValidationReport["decision"] | null; totalOptimizationRecords: number; frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[]; };
