import type { EmpireMemoryEngineConfiguration } from "./configuration.js";
import type { EME_CAPABILITIES, ENGINE_STATUSES, HEALTH_STATUSES, MEMORY_CATEGORIES, OPERATIONAL_STATES, VALIDATION_STATUSES } from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireMemoryCapability = (typeof EME_CAPABILITIES)[number];
export type EmpireMemoryInput = {
  companyReference?: string; memoryCategory?: MemoryCategory; eventReference?: string; decisionReference?: string;
  importanceLevel?: number; validated?: boolean; summary?: string; memoryRecordId?: string;
  authorizedHistoricalAlteration?: boolean; authorizationClaim?: string;
};
export type MemoryRecord = {
  memoryRecordId: string; timestamp: string; companyReference: string; memoryCategory: MemoryCategory;
  eventReference: string | null; decisionReference: string | null; importanceLevel: number;
  validationStatus: ValidationStatus; metadataVersion: string; structuralSignalOnly: true;
  neverAlterValidatedHistoricalRecordsWithoutAuthorization: true; preserveHistoricalTraceability: true;
  preserveAuditability: true; memoryTraceId: string; unvalidatedClaim: "none";
  authorizedHistoricalAlteration: boolean;
};
export type MemoryRecommendation = {
  recommendationId: string; timestamp: string; companyReference: string; recommendationSummary: string;
  memoryValue: number; structuralSignalOnly: true; unvalidatedClaim: "none";
};
export type MemoryValidationReport = {
  validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail";
  errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string;
};
export type EmpireMemoryEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-EME-001";
  currentOperationalState: OperationalState; healthStatus: HealthStatus; validationStatus: ValidationStatus;
  supportedCapabilities: EmpireMemoryCapability[]; frameworkModuleId: string | null;
  dependencyPresence: { empireIntelligenceFramework: boolean; empireKnowledgeEngine: boolean }; metadataVersion: string;
};
export type EmpireMemoryRunReport = {
  memoryRunReportId: string; runTimestamp: string; action: string; engineRecord: EmpireMemoryEngineRecord;
  memoryRecords: MemoryRecord[]; recommendations: MemoryRecommendation[]; validation: MemoryValidationReport;
  durationMs: number; metadataVersion: string;
};
export type EmpireMemoryState = {
  engineVersion: "PILLOW-EME-001"; missionId: "X5-03"; status: EngineStatus; initializedAt: string;
  configuration: EmpireMemoryEngineConfiguration; latestReport: EmpireMemoryRunReport | null;
  engineRecord: EmpireMemoryEngineRecord | null;
  health: { status: HealthStatus; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: MemoryValidationReport["decision"] | null; totalMemoryRecords: number; notes: string[] };
};
export type EmpireMemoryCockpitSnapshot = {
  engineStatus: EngineStatus; healthStatus: HealthStatus; operationalState: OperationalState | null;
  lastDecision: MemoryValidationReport["decision"] | null; totalMemoryRecords: number;
  frameworkRegistered: boolean; dependenciesConnected: number; recentLogs: string[];
};
